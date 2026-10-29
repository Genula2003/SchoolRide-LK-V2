import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class RidesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RidesGateway.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }

      const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-schoolride-lk-min-32-chars-long!';
      const decoded = jwt.verify(token, secret) as { sub: string; email: string; role: string };
      client.data.user = decoded;
      this.logger.log(`Client connected: ${client.id} (user: ${decoded.email})`);
    } catch (err) {
      this.logger.warn(`Unauthorized WebSocket connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_ride')
  async handleJoinRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideSessionId: string },
  ) {
    const user = client.data.user;
    if (!user || !data.rideSessionId) {
      client.emit('error', { message: 'Authentication required to subscribe to ride tracking.' });
      return;
    }

    // Verify ride session exists and is currently active
    const ride = await this.prisma.rideSession.findUnique({
      where: { id: data.rideSessionId },
      include: {
        driverProfile: true,
        passengers: {
          include: {
            booking: { include: { parent: true } },
          },
        },
      },
    });

    if (!ride) {
      client.emit('error', { message: 'Ride session not found.' });
      return;
    }

    if (ride.status !== 'IN_PROGRESS') {
      client.emit('error', { message: 'Ride session is not currently active.' });
      return;
    }

    // Authorization check: User must be driver, or parent of one of the passengers, or admin
    const isDriver = ride.driverProfile.userId === user.sub;
    const isParentOfPassenger = ride.passengers.some((p) => p.booking.parent.userId === user.sub);
    const isAdmin = user.role === 'ADMIN';

    if (!isDriver && !isParentOfPassenger && !isAdmin) {
      this.logger.warn(`Unauthorized ride subscription attempt by user ${user.sub} on ride ${data.rideSessionId}`);
      client.emit('error', { message: 'Access denied. You are not authorized to track this ride.' });
      return;
    }

    const roomName = `ride:${data.rideSessionId}`;
    client.join(roomName);
    this.logger.log(`User ${user.email} joined ${roomName}`);

    client.emit('joined_ride', {
      rideSessionId: data.rideSessionId,
      currentLatitude: ride.currentLatitude,
      currentLongitude: ride.currentLongitude,
      lastLocationUpdateAt: ride.lastLocationUpdateAt,
      routeName: ride.routeName,
      status: ride.status,
    });
  }

  @SubscribeMessage('leave_ride')
  handleLeaveRide(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { rideSessionId: string },
  ) {
    if (data.rideSessionId) {
      client.leave(`ride:${data.rideSessionId}`);
    }
  }

  // Broadcasters called by RidesService
  broadcastLocation(
    rideSessionId: string,
    payload: {
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
      timestamp: Date;
    },
  ) {
    if (this.server) {
      this.server.to(`ride:${rideSessionId}`).emit('location_update', payload);
    }
  }

  broadcastPassengerStatus(
    rideSessionId: string,
    payload: {
      passengerId: string;
      childId: string;
      childName: string;
      pickupStatus: string;
      timestamp: Date;
    },
  ) {
    if (this.server) {
      this.server.to(`ride:${rideSessionId}`).emit('passenger_update', payload);
    }
  }

  broadcastRideEnded(rideSessionId: string) {
    if (this.server) {
      this.server.to(`ride:${rideSessionId}`).emit('ride_ended', {
        rideSessionId,
        endedAt: new Date(),
      });
    }
  }
}
