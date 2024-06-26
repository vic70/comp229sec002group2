import express from "express";
import userCtrl from "../controllers/user.controller.js";
import authCtrl from "../controllers/auth.controller.js";

const router = express.Router();
router.route("/api/users").post(userCtrl.create);

// const isProfessor = (req, res, next) => {
//   //TODO - check if user is a professor

//   // const isSeller = req.profile && req.profile.seller;
//   // if (!isSeller) {
//   //   return res.status("403").json({
//   //     error: "User is not a seller",
//   //   });
//   // }
//   next();
// };

router.param("userId", userCtrl.userByID);

router.route("/api/users").get(userCtrl.list);
router
  .route("/api/users/:userId")
  //.get(authCtrl.requireSignin, userCtrl.read);
  //   .get(authCtrl.requireSignin, userCtrl.userByID)
  .put(authCtrl.requireSignin, authCtrl.hasAuthorization, userCtrl.update)
  .delete(authCtrl.requireSignin, authCtrl.hasAuthorization, userCtrl.remove);
router.route("/api/users/:userId").get(userCtrl.read); // TODO: Require Sign In
// router.route("/api/users/:userId").put(userCtrl.update);
// router.route("/api/users/:userId").delete(userCtrl.remove);

export default router;
