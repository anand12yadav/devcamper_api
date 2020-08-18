const fs=require("fs")
const mongoose=require("mongoose")
const colors=require("colors")
const dotenv=require("dotenv")

//load env vars
dotenv.config({path:"./config/config.env"})

//load models
const Bootcamp=require("./models/Bootcamp")
const Course=require("./models/Course")
const User=require("./models/User")
const Review=require("./models/Review")

//connect to database
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology:true
})

// Read JSON files

const bootcamps=JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`,`utf-8`))
const courses=JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`,`utf-8`))
const users=JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`,`utf-8`))
const review=JSON.parse(fs.readFileSync(`${__dirname}/_data/review.json`,`utf-8`))



// Import bootcamps in DB
const importData= async()=>{
    try {
      await Bootcamp.create(bootcamps)  
      await Course.create(courses)
      await User.create(users)
      await Review.create(review)
      console.log("Data imported...".green.inverse)
      process.exit()
    } catch (error) {
        console.log(error)
    }
}

// Delete all bootcamps from DB
const deleteData= async()=>{
    try {
      await Bootcamp.deleteMany()  
      await Course.deleteMany()
      await User.deleteMany()
      await Review.deleteMany()
      console.log("Data deleted...".red.inverse)
      process.exit()
    } catch (error) {
        console.log(error)
    }
}

if(process.argv[2]=="-i"){
 importData()
}else if(process.argv[2]=="-d"){
 deleteData()
}

