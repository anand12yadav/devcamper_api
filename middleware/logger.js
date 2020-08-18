
const logger=(req,res,next)=>{
    req.hello="hello world"
    next()
}

module.exports=logger