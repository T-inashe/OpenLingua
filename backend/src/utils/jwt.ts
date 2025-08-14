import jwt from 'jsonwebtoken';


export interface JWTPayload{
    userId: string,
    email: string
}


export const generateTokens = (payload : JWTPayload) => {
    
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET!,
         {expiresIn : '15m'}
    );

    const refreshToken = jwt.sign(
        {userID : payload.userId},
        process.env.JWT_REFRESH_SECRET!,
        {expiresIn : '7d'}
    );

    return {accessToken, refreshToken};
}

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): {userId: string} => {
    return jwt.verify(token, process.env.JWT_REFRESH_SCRET!) as {userId: string};
}