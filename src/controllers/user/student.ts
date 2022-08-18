import { response } from "express";
import { any } from "joi";
import mongoose from "mongoose";
import { apiResponse, dateFormeterToTime, getArea, getDurationInDays } from "../../common";
import { libraryModel } from "../../database/models/library";
import { sectionModel } from "../../database/models/librarySection";
import { orderModel } from "../../database/models/order";
import { studentModel } from "../../database/models/student";
import qrcode from "qrcode"
import { reqInfo, responseMessage } from "../../helper";
import config  from "config";

import { json } from "body-parser";
const PaytmChecksum = require("../../helper/paytmChecksum")
var https = require('https');

var paytmConfig : any = config.get("paytmConfig");

const ObjectId: any = mongoose.Types.ObjectId


export const getNearByLibraries = async (req, res) => {
    reqInfo(req);
    let { latitude, longitude } = req.body;

    try {
        let location_data: any, match: any = {}
        if (latitude && longitude) {
            location_data = await getArea({ lat: latitude, long: longitude }, 50)  //in 50km range
            match.latitude = { $gte: location_data.min.lat, $lte: location_data.max.lat }
            match.longitude = { $gte: location_data.min.long, $lte: location_data.max.long }
        }
        //  console.log(match);

        const libraries = await libraryModel.find({ "gpsAddress.latitude": match.latitude, "gpsAddress.longitude": match.longitude, isActive: true });
        if (!libraries)
            return res.status(404).json(await apiResponse(404, "there is no libraries to show!", {}, {}));

        return res.status(200).json(await apiResponse(200, "libraries", libraries, {}));

    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }

}

export const isLibraryFull = async (req, res, next) => {
    next()
}

export const makeOrder = async (req, res, next) => {
    reqInfo(req);
    let { isShiftingUser, shiftId, libId, libSectionName, bookingStartDate, bookingEndDate } = req.body,
        { user } = req.headers,
        shiftName: any;

    try {

        shiftName = isShiftingUser ? shiftId : libSectionName;
        const section = await sectionModel.findOne({ libraryId: ObjectId(libId), sectionId: libSectionName });
        if (!section)
            return res.status(404).json(await apiResponse(404, "there is no section to book tikit", {}, {}));

        const duration = getDurationInDays(bookingEndDate, bookingStartDate);
        console.log(duration);
        const order = {
            userId: ObjectId(user._id),
            libId: ObjectId(libId),
            sectionId: ObjectId(section._id),
            shift: shiftName,    //here shift is our sectionName or shiftName
            duration: duration,
            bookingStartDate: bookingStartDate,
            bookingEndDate: bookingEndDate,
            paymentId: "xyz:123456",
            fees: 400
        }
        const orderDetail : any = await new orderModel(order).save()

 //----------------------------paytm------------------------------------------------------------------
 //----------------------------paytm-----------------------------------------------------------------------

        var paytmParams : any= {};

        paytmParams.body = {
            "requestType": "Payment",
            "mid": paytmConfig.MID,
            "websiteName": paytmConfig.WEBSITE,
            "orderId": orderDetail._id.toString(),
            "callbackUrl": paytmConfig.StagingEnvironment,  //for production productionEnvieroment
            "txnAmount": {
                "value": orderDetail.fees,
                "currency": "INR",
            },
            "userInfo": {
                "custId": "CUST_001",
            },
        };
    
        PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), paytmConfig.MKEY).then(function (checksum) {
            paytmParams.head = {
                "signature": checksum
            };
    
            var post_data = JSON.stringify(paytmParams);
    
            var options = {
    
                /* for Staging */
                //         /* for Staging */
                //         hostname: 'securegw-stage.paytm.in', 
    
                //         /* for Production */
                //         // hostname: 'securegw.paytm.in',
                hostname: paytmConfig.ENV,
                port: 443,
                path: '/theia/api/v1/initiateTransaction?mid=' + paytmConfig.MID + '&orderId=' + orderDetail._id.toString(),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                }
            };
    
            var response = "";
            var post_req = https.request(options, function (post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });
    
                post_res.on('end',async function () {
                    var obj = JSON.parse(response);
                    console.log(obj);
                    var data = { env: paytmConfig.ENV, mid: paytmConfig.MID, amount: orderDetail.fees, orderid: orderDetail._id, txntoken: obj.body.txnToken }
    
                    // res.render(__dirname + '/index.html', { data: data });
                    //send response with txnTOken
                   return res.status(200).json(await apiResponse(200 , "paymentData with Txn token" , data , {}));

                });
            });
            post_req.write(post_data);
            post_req.end();

        });

        //--------------------------------------------------------------------------------------------------------
    
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}

export const paytm_transaction_status = async(req,res)=>
{
    reqInfo(req);
    let { user } = req.headers,
    {orderId} = req.body;

    try{
        
/* initialize an object */
var paytmParams : any = {};

/* body parameters */
paytmParams.body = {

    /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
    "mid" : paytmConfig.MID,

    /* Enter your order id which needs to be check status for */
    "orderId" : orderId,
};

/**
* Generate checksum by parameters we have in body
* Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
*/
PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body),  paytmConfig.MKEY).then(function(checksum){
    /* head parameters */
    paytmParams.head = {

        /* put generated checksum value here */
        "signature"	: checksum
    };

    /* prepare JSON string for request */
    var post_data = JSON.stringify(paytmParams);

    var options = {

        /* for Staging */
        hostname: paytmConfig.ENV,

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    // Set up the request
    var response : any = "";
    var post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', async function(){
            let obj = JSON.parse(response);
            console.log('Response: ', obj);

 //---------//if transactionStatus is success then make isPaymentDone true on this orderId-----------------------------------------------------------------
            // .....here this change will come
            if(obj.body.resultInfo.resultStatus == "TXN_SUCCESS" )
            await orderModel.findById(ObjectId(orderId) , {isPaymentDone : true})
            //then send data to the frontend and frontend will redirect them to anything
            return res.status(200).json(await apiResponse(200 , "trasactionStatus data" , obj.body , {}));
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
});

    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }


}

export const cancel_payment = async(req,res)=>
{
    reqInfo(req);
    let { user } = req.headers,
    {orderId} = req.body;

    try{

        const orderDetail = await orderModel.findOne(ObjectId(orderId));
        if(orderDetail?.isPaymentDone == true)
        {
            return res.status(200).json(await apiResponse(200, 'Payment has been successfully completed', { action: "User press back button, So nothing do in backend side" }, {}))
        }


        await orderDetail.deleteOne(ObjectId(orderId));

        return res.status(200).json(await apiResponse(200 , "payment has been canceled" , {} , {}))


    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}

export const bookSeat = async (req, res) =>//need libraryId,librarysectionId, userDetails , booking(intialtime, endtime)  , isShiftingUser
{
    reqInfo(req);
    let { isShiftingUser, shiftId, libId, libSectionName, bookingStartDate, bookingEndDate  , orderId} = req.body,
        { user } = req.headers;
    try {
        //(1)-->save student to library with his latest order
       const lib =  await libraryModel.findOne(ObjectId(libId) );
       const students = lib.students;
       let flag = false ;

       for(let  i = 0 ; i < students.length ; i ++)
       {
          let stu : any = students[i];
          if(stu.userId.toString() == user?._id.toString())
          {
            flag = true;
            stu.latestOrder = ObjectId(orderId);
          }

       }
       if(flag == false)
       {
        let studentData = { userId : ObjectId(user._id) , latestOrder : ObjectId(orderId)}
        students.push(studentData)
       }
       const updatedLib = await lib.save()

 //(2)-->=========================================allocate seat===================================================
        if (!isShiftingUser) {
            //first find student
            const response = await studentModel.findOne({ _id: user._id });
            if (!response)
                return res.status(404).json(await apiResponse(404, "there is no student", {}, {}));

            //find section
            const section = await sectionModel.findOne({ libraryId: ObjectId(libId), sectionId: libSectionName });
            if (!section)
                return res.status(404).json(await apiResponse(404, "there is no section to book tikit", {}, {}));


            const person = {
                name: response.name,
                imageUrl: "https://pixabay.com/illustrations/icon-user-male-avatar-business-5359553/",
                uId: user._id,
                shift: libSectionName,
                shiftingIntial: section.openingTime,
                shiftingEnd: section.closingTime,
                bookingStart: bookingStartDate,
                bookingEnd: bookingEndDate,
                status: "disconnected"
            }
            //now push this person by finding appropriate seat
            let seats = section.seats;
            for (let i = 0; i < seats.length; i++) {
                let seat: any = seats[i];
                if (seat.persons.length == 0) {
                    //push person 
                    seat.persons.push(person);
                    const updatedSection = await section.save();
                    if (!updatedSection)
                        return res.status(400).json(await apiResponse(400, "error in saving updatedSection", {}, {}))

                    //update  the order and send response
                    await orderModel.findByIdAndUpdate(ObjectId(orderId) , {seatNo  : i});
                    return res.status(200).json(await apiResponse(200, "seat booked sucessfully", seat, {}))
                }

            }
        
            return res.status(200).json(await apiResponse(200, "slot booking error where user is not shiftinguser", {}, {}));
        }

        //--------------------------------------------
        //else student is shifting user now new logic
        const response = await studentModel.findOne({ _id: user._id });
        if (!response)
            return res.status(404).json(await apiResponse(404, "there is no student", {}, {}));

        //find section
        const section = await sectionModel.findOne({ libraryId: ObjectId(libId), sectionId: libSectionName });
        if (!section)
            return res.status(404).json(await apiResponse(404, "there is no section to book tickit", {}, {}));

        const shifts = section.shifts;
        let myShift;

        //find shift details
        for (let i = 0; i < shifts.length; i++) {
            let shift: any = shifts[i];
            if (shift.shiftId == shiftId) {
                myShift = shift;
                break;
            }
        }

        const person = {
            name: response.name,
            imageUrl: "https://pixabay.com/illustrations/icon-user-male-avatar-business-5359553/",
            uId: user._id,
            shift: myShift,
            shiftingIntial: myShift.startTime,
            shiftingEnd: myShift.endTime,
            bookingStart: bookingStartDate,
            bookingEnd: bookingEndDate,
            status: "disconnected"
        }

        const duration = getDurationInDays(bookingEndDate, bookingStartDate);
        console.log(duration);
        const order = {
            userId: ObjectId(user._id),
            libId: ObjectId(libId),
            sectionId: ObjectId(section._id),
            shift: shiftId,  //here shift is shifting user shift
            duration: duration,
            bookingStartDate: bookingStartDate,
            bookingEndDate: bookingEndDate,
            paymentId: "xyz:123456",
            fees: 400
        }

        let seats: any = section.seats;
        let lastEmptyIndex: any , count = false;
        for (let i = 0; i < seats.length; i++) {
            let seat: any = seats[i];

            if (seat.persons.length == 0){
                    if (count == false) {
                        count = true;
                        lastEmptyIndex = i;
                    }
            }
            if (seat.isShiftingSeat == true) {
                // console.log("insideShiftingseat true");
                //find this seat's upperBound and lowerBound
                const persons: any = seat.persons;

                let intialBound: any = persons[0].shiftingIntial,
                    endBound: any = persons[0].shiftingEnd;

                for (let j = 0; j < persons.length; j++) {
                    let person = persons[j];

                    //set upperBound
                    if (dateFormeterToTime(person.shiftingIntial) < dateFormeterToTime(intialBound))
                        intialBound = person.shiftingIntial;
                    //set lowerBound
                    if (dateFormeterToTime(person.shiftingEnd) > dateFormeterToTime(endBound))
                        endBound = person.shiftingEnd;
                }

                // console.log("person intialBound" , dateFormeterToTime(intialBound));
                // console.log("person endBound" , dateFormeterToTime(endBound));
                // console.log("myshift start" , dateFormeterToTime(myShift.startTime));
                // console.log("myshift end" , dateFormeterToTime(myShift.endTime));
                // console.log(dateFormeterToTime(endBound) >dateFormeterToTime(myShift.endTime) );

                if ((dateFormeterToTime(myShift.startTime) >= dateFormeterToTime(endBound) && dateFormeterToTime(myShift.endTime) >= dateFormeterToTime(intialBound)) ||
                    (dateFormeterToTime(myShift.startTime) <= dateFormeterToTime(intialBound) && dateFormeterToTime(myShift.endTime) <= dateFormeterToTime(intialBound))) {
                    //assign combine seat
                    seat.persons.push(person);
                    const updatedSection = await section.save();

                    if (!updatedSection)
                        return res.status(400).json(await apiResponse(400, "error in saving updatedSection", {}, {}))

                     //update  the order and send response
                     await orderModel.findByIdAndUpdate(ObjectId(orderId) , {seatNo  : i});
                    return res.status(200).json(await apiResponse(200, "seat booked sucessfully in combine ", seat, {}))

                }
            }
        }
        //no shifting seat avilable in entier seats array so allocate seat at lastEmptyIndex
        seats[lastEmptyIndex].persons.push(person);
        seats[lastEmptyIndex].isShiftingSeat = true;
        const updatedSection = await section.save();
        if (!updatedSection)
            return res.status(400).json(await apiResponse(400, "error in saving updatedSection", {}, {}))

        // const orderDetail = await new orderModel(order).save();
         //update  the order and send response
         await orderModel.findByIdAndUpdate(ObjectId(orderId) , {seatNo  : lastEmptyIndex});
        return res.status(200).json(await apiResponse(200, "seat booked sucessfully", seats[lastEmptyIndex], {}))
    }
    catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}

export const test = async (req, res) => {
    reqInfo(req)
    let { user } = req.headers;

    try{

        let data = {
            name:"Employee Name",
            age:27,
            department:"Police",
            id:"aisuoiqu3234738jdhf100223"
        }

        let stringdata = JSON.stringify(data)
        qrcode.toString(stringdata,{type:'terminal'}, function (err, qrcode) {
  
            if(err) return console.log("error occurred")
 
             // Printing the generated code
             console.log(qrcode)
          })
   
        // Converting the data into base64
        qrcode.toDataURL(stringdata, function (err, code) {
            if(err) return console.log("error occurred")
        
            // Printing the code
            console.log(code)
        })
        
    } catch (error) {
        console.log(error);
        return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
    }
}


