import express, {Request, Response} from 'express';
import { TupleType } from 'typescript';


export const calcAccAngleDiff = (accelxyz1: number[], accelxyz2: number[]) => 
{
    // expecting 3 values (x,y,z) for each accel reading
    if (accelxyz1.length !== 3 || accelxyz2.length !== 3) {
        throw new Error('Invalid input: expected 3 values for each accel reading');
    }

    // calculate angle between accel vectors using dot product formula
    // cosθ= a1⋅a2 / (∣a1​∣∣a2​∣)

    // |x| = sqrt(x1^2 + x2^2 + x3^2)
    var magA1 = Math.sqrt(accelxyz1[0]**2 + accelxyz1[1]**2 + accelxyz1[2]**2);
    var magA2 = Math.sqrt(accelxyz2[0]**2 + accelxyz2[1]**2 + accelxyz2[2]**2);
    console.log('Magnitude of accel 1:', magA1);
    console.log('Magnitude of accel 2:', magA2);

    // dot product = x1*x2 + y1*y2 + z1*z2
    var dotProduct = accelxyz1[0]*accelxyz2[0] + accelxyz1[1]*accelxyz2[1] + accelxyz1[2]*accelxyz2[2];
    
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

