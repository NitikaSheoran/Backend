// const asyncHandler = (fn) => async (req, res, next) => {
//     try{
//         await fn(req, res, next);
//     }catch(error){
//         console.log("Error in async function:: ", error);
//     }
// }


const asyncHandler = (fn) =>{
    (req, res, next) => {
        Promise.resolve(fn(req, res, next))
        .catch((error)=>{
            console.log("error:: ", error);
        })
    }
}
export {asyncHandler} 