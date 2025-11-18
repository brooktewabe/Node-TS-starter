import mongoose, { Schema } from "mongoose";
import moment from "moment-timezone";
import crypto from "crypto";
import type { ITicket } from "../config/types/ticket.d.ts";

const TicketCounterSchema = new Schema({
  date: { type: String, required: true }, 
  lastTicketNo: { type: Number, default: 0 },
});

TicketCounterSchema.index({ date: 1 }, { unique: true });

export const ticketCounter = mongoose.model("TicketCounter", TicketCounterSchema);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNo: { type: String, unique: true, required: true },
    routeId: { type: Schema.Types.ObjectId, ref: "Route", required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    amountPaid: { type: Number, required: true },
    commission: { type: Number },
    expiryDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["redeemed", "unredeemed"],
      default: "unredeemed",
    },
    QRCode: { type: String },
  },
  { timestamps: true }
);

// generate sequential ticket number
TicketSchema.pre<ITicket>("save", async function (next) {
  const now = moment().tz("Africa/Addis_Ababa");
  const dateStr = now.format("YYYY-MM-DD");

  if (this.isNew) {
    try {
      // get or increment the ticket counter for today
      const counter = await ticketCounter.findOneAndUpdate(
        { date: dateStr },
        { $inc: { lastTicketNo: 1 } },
        { new: true, upsert: true }
      );

      const seq = counter.lastTicketNo.toString().padStart(4, "0");
      const ticketNo = `${now.format("YY")}${now.dayOfYear().toString().padStart(3, "0")}${seq}`;

      this.ticketNo = ticketNo;

      const hash = crypto
        .createHash("sha256")
        .update(ticketNo + this.accountId.toString())
        .digest("hex");

      this.QRCode = hash;
    } catch (err) {
      return next(err as Error);
    }
  }

  this.set({ updatedAt: now.toDate() });
  next();
});

TicketSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    delete ret.__v;
    return ret;
  },
});

export const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema);
