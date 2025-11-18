export default [
  {
    groupName: "super_admin",
    realm: "BSMS",
    permissions: [
      "get users",
      "delete user",
      "create user",
      "update user",
    ],
  },
  {
    groupName: "cashier",
    realm: "BSMS",
    permissions: [
      "get users",
      "update user",
      "get customers",
    ],
  }
];
