const path=require("path")
const Bootcamp=require("../models/Bootcamp")
const asyncHandler=require("../middleware/async")
const geocoder=require("../utils/geocoder")
const ErrorResponse=require("../utils/errorResponse")


//@desc Get all bootcamps
//@route GET /api/v1/bootcamps
//@access public
exports.getBootcamps= asyncHandler( async (req,res,next)=>{
    let query

    // Copy req.query
    const reqQuery={...req.query}

    // Fileds to exclude
    const removeFields=["select","sort","page","limit"]

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param=>delete reqQuery[param])

    //Create query string
    let queryStr= JSON.stringify(reqQuery)

    queryStr=queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g,match=>`$${match}`)
    query=Bootcamp.find(JSON.parse(queryStr))

    //Select fields
    if(req.query.select){
        const fields=req.query.select.split(",").join(" ")
        query=query.select(fields)
    }

    //sort
    if(req.query.sort){
        const sortBy=req.query.sort.split(",").join(" ")
        query=query.sort(sortBy)
    }else{
        query=query.sort("-createdAt")
    }

    //pagination 
    const page=parseInt(req.query.page,10) || 1
    const limit=parseInt(req.query.limit,10) || 25
    const startIndex=(page-1)*limit
    const endIndex=page*limit
    const total=await Bootcamp.countDocuments()
    
    query=query.skip(startIndex).limit(limit)

    //Pagination
    const pagination={}

    if(endIndex<total){
        pagination.next={
            page:page+1,
            limit
        }
    }

    if(startIndex>0){
        pagination.prev={
            page:page-1,
            limit
        }
    }

    //find resources
    const bootcamps=await query

        res
            .status(200)
            .json({sucess: true,count:bootcamps.length,pagination, body:bootcamps})
    
  //res.status(400).json({success:false})
  //next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`,404))
     
})

//@desc Get single bootcamp
//@route GET /api/v1/bootcamps/:id
//@access public
exports.getBootcamp= asyncHandler( async (req,res,next)=>{
      const bootcamp =await Bootcamp.findById(req.params.id)
      if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id ${req.params.id}`,404))
      }
      res.status(200).json({success:true,data:bootcamp})     
})


//@desc    create new bootcamp
//@route   POST /api/v1/bootcamps/:id
//@access  public
exports.createBootcamp=asyncHandler( async (req,res,next)=>{
   // console.log(req.body)
   // res.status(200).json({success:true,msg:"Create a bootcamp"})

   //Add user to req.body
   req.body.user=req.user.id

   //check for published bootcamps
   const publishedBootcamp=await Bootcamp.findOne({user:req.user.id})

   //If the user is not an admin, they can only add one bootcamp
   if(publishedBootcamp && req.user.role !=="admin"){
       return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp`,400))
   }
   
    const bootcamp=await Bootcamp.create(req.body)
    res.status(201).json({
        sucess:true,
        data:bootcamp
    })        
})


//@desc    Update bootcamp
//@route   PUT /api/v1/bootcamps/:id
//@access  private
exports.updateBootcamp=asyncHandler(async (req,res,next)=>{
   
        let bootcamp=await Bootcamp.findById(req.params.id)
        if(!bootcamp){
            return next(new ErrorResponse(`Bootcamp not found with ID of $(req.params.id)`,404))
        }

        //Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !=="admin"){
            return next(new ErrorResponse(`User $(req.params.id) is not authorized to update this bootcamp`,401))

        }
        bootcamp=await Bootcamp.findOneAndUpdate(req.param.id,req.body,{
            new:true,
            runValidators:true
        })

        res.status(200).json({success:true,data:bootcamp})     
})

//@desc    Delete bootcamp
//@route   DELETE /api/v1/bootcamps/:id
//@access  private
exports.deleteBootcamp=asyncHandler(async (req,res,next)=>{
        const bootcamp=await Bootcamp.findById(req.params.id)
        if(!bootcamp){
            //return res.status(400).json({success:false})
            return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404))
        }
        //Make sure user is bootcamp owner
        if(bootcamp.user.toString() !== req.user.id && req.user.role !=="admin"){
            return next(new ErrorResponse(`User $(req.params.id) is not authorized to delete this bootcamp`,401))

        }
        bootcamp.remove()
        res.status(200).json({success:true,data:{}})  
    
})

//@desc    Get bootcamps within a radius
//@route   GET /api/v1/bootcamps/raduis/:zipcode/:distance
//@access  private
exports.getBootcampsInRadius=asyncHandler(async (req,res,next)=>{
    const {zipcode,distance}  =req.params

    //Get lat/lng from geocoder

   const loc=await geocoder.geocode(zipcode)
   const lat=loc[0].latitude
   const lng=loc[0].longitude

   //calc raduis using radians
   //Divide distance by raduis of Earth
   //Earth raduis = 3,963 mi / 6.378 km
   const radius=distance/3963

   const bootcamps= await Bootcamp.find({
       location:{$geoWithin:{$centerSphere: [[lng,lat],radius]}}
       })
    
    res.status(200).json({
      success:true,
      count: bootcamps.length,
      body:bootcamps 
    })
})

//@desc    Upload photo for bootcamp
//@route   PUT /api/v1/bootcamps/:id/photo
//@access  private
exports.bootcampPhotoUpload=asyncHandler(async (req,res,next)=>{
    const bootcamp=await Bootcamp.findById(req.params.id)
    if(!bootcamp){
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404))
    }
    //Make sure user is bootcamp owner
    if(bootcamp.user.toString() !== req.user.id && req.user.role !=="admin"){
        return next(new ErrorResponse(`User $(req.params.id) is not authorized to update this bootcamp`,401))

    }

    if(!req.files){
        return next(new ErrorResponse(`Please upload a file `,400))
    }
    //console.log(req.files.file)
   const file=req.files.file

   //make sure image is an photo
   if(!file.mimetype.startsWith('image')){
    return next(new ErrorResponse(`Please upload an image file `,400))
   }

   //Check file size 
   if(file.size > process.env.MAX_FILE_UPLOAD){
    return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} `,400))
   }

   //create custom file name
   file.name=`photo_${bootcamp._id}${path.parse(file.name).ext}`
   //console.log(file.name)

   file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`,async err=>{
       if(err){
           console.error(err)
           return next(new ErrorResponse(`Problem with file upload`,500))

       }
       await Bootcamp.findByIdAndUpdate(req.params.id,{photo:file.name})
       res.status(200).json({
           success:true,
           data:file.name
       })
   })

})
