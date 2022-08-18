import jwt from "jsonwebtoken"
import config from "config"
import moment from "moment";

const jwt_for_uniqueId = config.get("jwt_for_uniqueId");

export const apiResponse = async (status, message, data, error) => {
    return {
        status,
        message,
        data: await (data),
        error: Object.keys(error)?.length == 0 ? {} : await (error)
    }
}

export const file_path = ['profile', 'libraryPhotoes'];

export const getArea = (current: { lat: any, long: any }, RadiusInKm: number) => {
    const differenceForLat = RadiusInKm / 111.12
    const curve = Math.abs(Math.cos((2 * Math.PI * parseFloat(current.lat)) / 360.0))
    const differenceForLong = RadiusInKm / (curve * 111.12)
    const minLat = parseFloat(current.lat) - differenceForLat
    const maxLat = parseFloat(current.lat) + differenceForLat
    const minlon = parseFloat(current.long) - differenceForLong
    const maxlon = parseFloat(current.long) + differenceForLong;
    return {
        min: {
            lat: minLat,
            long: minlon,
        },
        max: {
            lat: maxLat,
            long: maxlon,
        },
    };
}


export const getUniqueId = (libId, seatNo) => {
    //p1->libId , p2->seatNo  and add time to make uniqueId
    return jwt.sign({
        libId: libId,
        seatNo: seatNo,
        createdAt: new Date()
    }, jwt_for_uniqueId)

}


export const dateFormeterToTime = (date) =>// 8:44:26 PM);
{
    let myDate = new Date(date);
    let momentDate = myDate.getHours();
    return momentDate
}

export const getDurationInDays = (date_1: any, date_2: any) => {
    date_1 = new Date(date_1);
    date_2 = new Date(date_2);
    let difference = date_1.getTime() - date_2.getTime();
    let TotalDays = Math.ceil(difference / (1000 * 3600 * 24)) + 1;
    return TotalDays;
}

export const no_of_days_between_two_date= (dateOne, dateTwo)=>
{
     // calculation of no. of days between two date 
// To set two dates to two variables
var date1 = new Date(dateOne);
var date2 = new Date(dateTwo);
  
// To calculate the time difference of two dates
var Difference_In_Time = date2.getTime() - date1.getTime();
  
// To calculate the no. of days between two dates
return  Math.ceil(Difference_In_Time / (1000 * 3600 * 24) );
}

export const getNextDate = (myDate, duration) => {
    let date = new Date(myDate);
    date.setDate(date.getDate() + duration);
    return date;
}