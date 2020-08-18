const Review=require("../models/Review")
const Bootcamp=require("../models/Bootcamp")
const asyncHandler=require("../middleware/async")
const ErrorResponse=require("../utils/errorResponse")

//@desc      Get reviews
//@route     GET /api/v1/reviews
//@route     GET /api/v1/courses/:bootcampId/reviews
//@access    public

exports.getReviews=asyncHandler(async (req,res,next)=>{
    

    if(req.params.bootcampId){
        const reviews=await Review.find({bootcamp:req.params.bootcampId})
        res.status(200).json({
            success:true,
            count:reviews.length,
            data:reviews
        })
    }else{
        res.status(200).json(res.advancedResults)
    }
 
    
})


//@desc      Get single reviews
//@route     GET /api/v1/reviews/:id
//@access    public

exports.getReview=asyncHandler(async (req,res,next)=>{
    
    const review= await Review.findById(req.params.id).populate({
        path:"bootcamp",
        select:"name description"
    })
 
    if(!review){
        return next(new ErrorResponse(`No review found with id of ${req.params.id}`,404))
    }
    res.status(200).json({
        sucess:true,
        data:review
    })
    
})

//@desc      Add review
//@route     POST /api/v1/bootcamps/:bootcampId/reviews
//@access    private

exports.addReview=asyncHandler(async (req,res,next)=>{
    
    req.body.bootcamp=req.params.bootcampId
    req.body.user=req.user.id

    const bootcamp=await Bootcamp.findById(req.params.bootcampId)
    if(!bootcamp){
        next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`,404))
    }

    const review=await Review.create(req.body)

    res.status(201).json({
        sucess:true,
        data:review
    })
    
})


//@desc      Update review
//@route     PUT /api/v1/reviews/:id
//@access    private
exports.updateReview=asyncHandler(async (req,res,next)=>{
    let review=await Review.findById(req.params.id)
    if(!review){
        next(new ErrorResponse(`No review with the id of ${req.params.id}`,404))
    }

    //Make sure review belongs to user or admin
    if(review.user.toString() !== req.user.id && req.user.role !=="admin"){
        next(new ErrorResponse(`Not authorize to update review,401`))
    }

     review=await Review.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true
    })

    res.status(200).json({
        sucess:true,
        data:review
    })
    
})


//@desc      delete review
//@route     Delete /api/v1/reviews/:id
//@access    private
exports.deleteReview=asyncHandler(async (req,res,next)=>{
    const review=await Review.findById(req.params.id)
    if(!review){
        next(new ErrorResponse(`No review with the id of ${req.params.id}`,404))
    }

    //Make sure review belongs to user or admin
    if(review.user.toString() !== req.user.id && req.user.role !=="admin"){
        next(new ErrorResponse(`Not authorize to update review,401`))
    }

     await review.remove()

    res.status(200).json({
        sucess:true,
        data:{}
    })
    
})

