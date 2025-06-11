// const asyncHandler = (fn) => async (req, res, next) => {
//     try{
//         await fn(req, res, next);
//     }catch(error){
//         console.log("Error in async function:: ", error);
//         next(error)
//     }
// }


const asyncHandler = (fn) =>{
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
        .catch((error)=>{
            console.log("error:: ", error);
            next(error);
        })
    }
}
export {asyncHandler} 