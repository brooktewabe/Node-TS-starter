import permissions from "../assets/permissions.ts";
import groups from "../assets/permission_groups.ts";

import permissionService from "../services/permission.service.ts";
import { type IPermission } from "../config/types/permission.ts";

import permissionGroupService from "../services/permission_group.service.ts";

import { type Types } from "mongoose";
import moment from "moment";

export default async function populatePermissions(): Promise<void> {
  // console.log("Populating Permissions...");
  try {
    const { body, statusCode } = await permissionService({
      method: "get collection",
      query: {},
    });
    const { status_code, return_body } = await permissionGroupService({
      method: "get group collection",
      query: {
        groupName: {
          $in: groups.map((group) => {
            return group.groupName;
          }),
        },
      },
    });

    interface group_ {
      groupName: any;
      permissions: { permissionName: any }[];
    }
    interface permission_ {
      permissionName: any;
    }

    let DBGroupNames = {} as any;
    return_body.data.map((_group: group_) => {
      DBGroupNames[`${_group.groupName}`] = _group.permissions.map(
        (_permission: permission_) => {
          return _permission.permissionName;
        }
      );
    });

    if (statusCode !== 200) {
      console.log("population error: ", body.error);
      return;
    }

    const dbPermissions = body.data as Array<
      IPermission & { _id: Types.ObjectId }
    >;
    let permissionNames = {} as any;
    DBGroupNames;
    dbPermissions.map((_permission) => {
      permissionNames[`${_permission.permissionName}`] = String(
        _permission._id
      );
    });

    let permissionsToAdd = [];
    let permissionsGroupToAdd = [];
    let permissionsGroupToUpdate = [] as {
      query: { groupName: string };
      updateData: { $set: { permissions: string[]; lastModified: string } };
    }[];

    for (let i = groups.length - 1; i >= 0; i--) {
      let _localgroup = groups[i];

      if (Object.keys(DBGroupNames).includes(groups[i].groupName)) {
        let _localpermissions = _localgroup.permissions as string[];

        if (DBGroupNames.hasOwnProperty(_localgroup.groupName)) {
          let dbPermissions = DBGroupNames[_localgroup.groupName] as string[];

          let _fileteredresult = _localpermissions.filter(
            (_data: string) => !dbPermissions.includes(_data)
          );
          if (_fileteredresult.length !== 0) {
            let permissions = DBGroupNames[_localgroup.groupName].map(
              (_name: string) => {
                return permissionNames[`${_name}`];
              }
            );

            _fileteredresult.map((_permission) => {
              permissions.push(permissionNames[`${_permission}`]);
            });

            console.log("COUNT FILTERED: ", _fileteredresult.length);
            permissionsGroupToUpdate.push({
              query: { groupName: _localgroup.groupName },
              updateData: {
                $set: {
                  permissions: permissions,
                  lastModified: moment().toISOString(),
                },
              },
            });
          }
        } else {
          console.error(
            `Group name ${_localgroup.groupName} does not exist in DBGroupNames`
          );
        }
      } else {
        console.log("   + ", permissions[i]);

        let _temppermissions = groups[i].permissions;

        let datatopush: any = {
          ...groups[i],
          permissions: [] as string[],
          // createdAt: moment().toISOString(),
          // lastModified: moment().toISOString(),
        };
        _temppermissions.map((_permission) => {
          datatopush.permissions.push(permissionNames[`${_permission}`]);
        });

        permissionsGroupToAdd.push(datatopush);
      }
    }

    for (let i = permissions.length - 1; i >= 0; i--) {
      if (Object.keys(permissionNames).includes(permissions[i] as any)) {
        // console.log("   - ", permissions[i]); // Permission exists
      } else {
        console.log("   + ", permissions[i]); // Permission does not exist
        permissionsToAdd.push({
          permissionName: permissions[i],
        });
      }
    }

    if (permissionsToAdd.length > 0) {
      const {
        statusCode: permissionInsertManyStatus,
        body: permissionInsertManyBody,
      } = await permissionService({
        method: "insert many",
        arrayOfData: permissionsToAdd as any,
      });

      if (permissionInsertManyStatus !== 200) {
        console.log(
          "error inserting permissions: ",
          permissionInsertManyBody.error
        );
      }
    }
    if (permissionsGroupToAdd.length > 0) {
      const {
        statusCode: permissionInsertManyStatus,
        body: permissionInsertManyBody,
      } = await permissionGroupService({
        method: "insert many",
        arrayOfData: permissionsGroupToAdd,
      });

      if (permissionInsertManyStatus !== 200) {
        console.log(
          "error inserting permissions: ",
          permissionInsertManyBody.error
        );
      } else {
        console.log(
          "success inserting permissions: ",
          permissionInsertManyBody
        );
      }
    }
    if (permissionsGroupToUpdate.length > 0) {
      permissionsGroupToUpdate.map(async (_permission) => {
        console.log("query", _permission.query);
        console.log("update", _permission.updateData);
        const {
          statusCode: permissionInsertManyStatus,
          body: permissionInsertManyBody,
        } = await permissionGroupService({
          method: "update",
          query: _permission.query,
          update: _permission.updateData,
        });
      });
    }
  } catch (error) {
    console.log("error in population: ", error);
  }
}
