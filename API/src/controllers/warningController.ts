import express, {Request, Response} from 'express';
import { TupleType } from 'typescript';


export const calcAngleDiff = (xyz1: number[], xyz2: number[]) => 
{
    // expecting 3 values (x,y,z)
    if (xyz1.length !== 3 || xyz2.length !== 3) {
        throw new Error('Invalid input: expected 3 values for each accel reading');
    }

    // calculate angle between vectors using dot product formula
    // cosθ= a1⋅a2 / (∣a1​∣∣a2​∣)

    // |x| = sqrt(x1^2 + x2^2 + x3^2)
    var magA1 = Math.sqrt(xyz1[0]**2 + xyz1[1]**2 + xyz1[2]**2);
    var magA2 = Math.sqrt(xyz2[0]**2 + xyz2[1]**2 + xyz2[2]**2);
    console.log('Magnitude of accel 1:', magA1);
    console.log('Magnitude of accel 2:', magA2);

    // dot product = x1*x2 + y1*y2 + z1*z2
    var dotProduct = xyz1[0]*xyz2[0] + xyz1[1]*xyz2[1] + xyz1[2]*xyz2[2];
    
    // Check for zero magnitudes to avoid division by zero
    if (magA1 === 0 || magA2 === 0) {
        throw new Error('Invalid input: acceleration vector magnitude cannot be zero');
    }

    console.log('Dot product of accel 1 and accel 2:', dotProduct);
    // cosθ= a1⋅a2 / (∣a1​∣∣a2​∣)
    var cosTheta = dotProduct / (magA1 * magA2);
    console.log('Cosine of angle difference:', cosTheta);

    // θ = arccos(cosθ)
    var angleDiff = Math.acos(cosTheta) * (180 / Math.PI); // convert to degrees
    console.log('Angle difference in degrees:', angleDiff);
    return angleDiff;

};

export const calcMagitudeDiff = (xyz1: number[], xyz2: number[]) => 
{
    // expecting 3 values (x,y,z) for each accel reading
    if (xyz1.length !== 3 || xyz2.length !== 3) {
        throw new Error('Invalid input: expected 3 values for each accel reading');
    }

    
    var magA1 = Math.sqrt(xyz1[0]**2 + xyz1[1]**2 + xyz1[2]**2);
    var magA2 = Math.sqrt(xyz2[0]**2 + xyz2[1]**2 + xyz2[2]**2);
    console.log('Magnitude of accel 1:', magA1);
    console.log('Magnitude of accel 2:', magA2);

    var magDiff = Math.abs(magA1 - magA2);
    return magDiff;
};
