import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ParentsModule } from './parents/parents.module';
import { DriversModule } from './drivers/drivers.module';
import { SchoolsModule } from './schools/schools.module';
import { BookingsModule } from './bookings/bookings.module';
import { RidesModule } from './rides/rides.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ParentsModule,
    DriversModule,
    SchoolsModule,
    BookingsModule,
    RidesModule,
    ReviewsModule,
    ComplaintsModule,
    NotificationsModule,
    AdminModule,
    StorageModule,
    HealthModule,
  ],
})
export class AppModule {}
