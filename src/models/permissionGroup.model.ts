import mongoose from "mongoose";
import type { PermissionGroup } from "../config/types/permission_group.d.ts";

const PermissionGroupSchema = new mongoose.Schema<PermissionGroup>(
  {
    groupName: { type: String, required: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    realm: {
        type: String,
        enum: ["BSMS"],
    },
    enabled: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdAt: { type: Date },
    lastModified: { type: Date },
  },
  {
    timestamps: true,
  }
);

const permissionGroupModel = mongoose.model<PermissionGroup>("PermissionGroup",PermissionGroupSchema);

export default permissionGroupModel;
