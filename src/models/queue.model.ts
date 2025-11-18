import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { IQueue } from '../config/types/queue.d.ts';

const QueueCounterSchema = new Schema({
  routeId: { type: Schema.Types.ObjectId, ref: "Route", required: true },
  date: { type: String, required: true }, 
  lastQueueNo: { type: Number, default: 0 },
},
{timestamps: true}
);

QueueCounterSchema.index({ routeId: 1, date: 1 }, { unique: true });

export const QueueCounter = mongoose.model("QueueCounter", QueueCounterSchema);

const QueueSchema = new Schema<IQueue>(
  {
    queueNo: { type: Number, required: true},
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    status: { type: String, enum: ['waiting','boarding', 'departed'], default: 'waiting' },
    seatAvailability: { type: Boolean, default: true },
  },
  { timestamps: true }
);

QueueSchema.pre<IQueue>("save", async function (next) {
  const now = moment().tz("Africa/Addis_Ababa");
  const dateStr = now.format("YYYY-MM-DD");

  // Set timestamps with timezone
  if (this.isNew) {
    this.set({ createdAt: now.toDate() });
  }
  this.set({ updatedAt: now.toDate() });

  // Generate queueNo only for new records
  if (this.isNew) {
    try {
      const counter = await QueueCounter.findOneAndUpdate(
        { routeId: this.routeId, date: dateStr },
        { $inc: { lastQueueNo: 1 } },
        { new: true, upsert: true }
      );

      this.queueNo = counter.lastQueueNo;
    } catch (err) {
      return next(err as Error);
    }
  }

  next();
});

QueueSchema.pre<IQueue>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

QueueSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Queue = mongoose.model<IQueue>('Queue', QueueSchema);
