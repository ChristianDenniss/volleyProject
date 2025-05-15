// errors/CustomError.ts
//our parent class to inherit frommm
export class CustomError extends Error
{
    statusCode: number;

    constructor(message: string, statusCode: number)
    {
        super(message);
        this.statusCode = statusCode;
        //js / type script thing, to fix instanceof failing?
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
