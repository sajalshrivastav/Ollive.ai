import { Request, Response ,NextFunction } from "express";


export function validateBody(requiredFields:string[]){
    return (req:Request, res: Response, next: NextFunction)=>{

        const missing  = requiredFields.filter((field)=> !req.body[field] )

        if(missing.length > 0){
            res.status(400).json({
                success:false,
                error:`Missing Required field: ${missing.join(", ")}`,
            });
            return
        }
        next();

    }
}