import mongoose from 'mongoose'
import type { Permission } from '../config/types/permission.d.ts'

mongoose.Promise = global.Promise

const Schema = mongoose.Schema

const PermissionSchema = new Schema<Permission>({
  permissionName: { type: String, required: true }
})

export default mongoose.model<Permission>('Permission', PermissionSchema)
