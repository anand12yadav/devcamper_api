const express=require("express")
const router=express.Router()
const {getBootcamp,
    getBootcamps,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    bootcampPhotoUpload
}=require("../controllers/bootcamps")

//Include other resources router
const courseRouter=require("./courses")
const reviewRouter=require("./reviews")

const {protect,authorize}=require("../middleware/auth")

//Re-route into other resource reouter
router.use("/:bootcampId/courses",courseRouter)
router.use("/:bootcampId/reviews",reviewRouter)

router.route("/radius/:zipcode/:distance")
.get(getBootcampsInRadius)

router.route("/:id/photo").put(protect,authorize('publisher','admin'), bootcampPhotoUpload)

router.route("/")
.get(getBootcamps)
.post(protect,authorize('publisher','admin'),createBootcamp)

router.route("/:id")
.get(getBootcamp)
.put(protect,authorize('publisher','admin'),updateBootcamp)
.delete(protect,authorize('publisher','admin'),deleteBootcamp)

module.exports=router