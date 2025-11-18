import { Request, Response, NextFunction } from 'express';
import { IUser } from "../config/types/Users.js";
import { User } from "../models/user.model.ts";

interface AuthRequest extends Request {
  user?: IUser & { permissions?: string[] };
}

export const authorization = (requiredPermission?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await User.findById(req.user._id).populate({
        path: "permissionGroup",
        populate: {
          path: "permissions",
          select: "permissionName",
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Flatten permissions and get the names
      const permissions: string[] = user.permissionGroup.flatMap((pg: any) =>
        pg.permissions.map((perm: any) => perm.permissionName)
      );

      // Attach permissions to req.user
      req.user = Object.assign({}, user.toObject(), { permissions });

      // If specific permission is required, check it
      if (requiredPermission && !permissions.includes(requiredPermission)) {
        return res.status(403).json({ message: "Forbidden: missing permission" });
      }

      next();
    } catch (err) {
      console.error("Error attaching permissions:", err);
      res.status(500).json({ message: "Server error" });
    }
  };
};
