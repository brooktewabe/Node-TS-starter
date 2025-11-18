import {
  type Types,
  type Document,
  type FilterQuery,
  type ProjectionType,
  type QueryOptions,
  type UpdateQuery,
} from "mongoose";
import { type IPermission } from "./permission";

export interface IPermissionGroup {
  _id?: Types.ObjectId;
  groupName: string;
  permissions: IPermission[];
  realm?: string;
  // role?: string;
  // permissionCategory?: types.ObjectId[];
  enabled: boolean;
  isDeleted: boolean;
  createdAt: Date;
  lastModified: Date;
}

export type PermissionGroup = Document & IPermissionGroup;

export interface PermissionGroupFilter extends FilterQuery<PermissionGroup> {}

export interface PermissionGroupProjection
  extends ProjectionType<PermissionGroup> {}

export interface PermissionGroupOptions extends QueryOptions<PermissionGroup> {}

export interface PermissionGroupUpdate extends UpdateQuery<PermissionGroup> {}

