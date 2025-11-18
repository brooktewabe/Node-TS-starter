import { User } from "../models/user.model.ts";
import permissionGroupModel from "../models/permissionGroup.model.ts";

const SUPER_ADMIN_DATA = {
  fullName: "Super Admin",
  phoneNumber: "+251900000000",
  role: "super_admin",
  isVerified: true,
  realm: "BSMS",
  password: "$uperPass@1234",
};

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });

    if (existingSuperAdmin) {
      return;
    }
    // Fetch the super_admin permission group
    const permissionGroup = await permissionGroupModel.findOne({
      groupName: "super_admin",
      realm: "BSMS",
    });
    if (!permissionGroup) {
      throw new Error("Permission group for super_admin not found.");
    }

    const superAdmin = new User({
      ...SUPER_ADMIN_DATA,
      permissionGroup: [permissionGroup._id],
    });

    await superAdmin.save();
    console.log("Super Admin seeded successfully.");
  } catch (error) {
    console.error("Error seeding super admin:", error);
  }
};
