import mongoose, { Schema } from 'mongoose';
import moment from 'moment-timezone';
import type { ICommission } from '../config/types/commission.d.ts';

const CommissionSchema = new Schema<ICommission>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    amount: { type: Number},
  },
  { timestamps: true }
);

// Add local timezone to timestamps
CommissionSchema.pre<ICommission>('save', function (next) {
  const now = moment().tz('Africa/Addis_Ababa').format();
  if (this.isNew) {
    this.set({ createdAt: now });
  }
  this.set({ updatedAt: now });
  next();
});

CommissionSchema.pre<ICommission>('findOneAndUpdate', function (next) {
  this.set({ updatedAt: moment().tz('Africa/Addis_Ababa').format() });
  next();
});

CommissionSchema.set('toJSON', {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Commission = mongoose.model<ICommission>('Commission', CommissionSchema);
