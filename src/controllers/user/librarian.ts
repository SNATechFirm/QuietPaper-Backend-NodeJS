import { apiResponse, getNextDate, getUniqueId, no_of_days_between_two_date } from "../../common";
import { responseMessage } from "../../helper";
import { reqInfo } from "../../helper";
import { libraryModel } from "../../database/models/library";
import { sectionModel } from "../../database/models/librarySection";
import mongoose from "mongoose";
import { roomModel } from "../../database/models/room";
import { studentModel } from "../../database";
import { orderModel } from "../../database/models/order";
const ObjectId: any = mongoose.Types.ObjectId;

export const addLibrary = async (req, res) => {
  reqInfo(req);
  let body = req.body;
  let { user } = req.headers;
  body.libraryName = (body.libraryName as string).trim();

  // if(user.role != "librarian")
  // {
  //     return res.status(404).json(await apiResponse(404, "unauthrozied access" , null,null));
  // }
  try {
    let isExist = await libraryModel.findOne({
      libraryName: req.body.libraryName,
      isActive: true,
    });
    if (isExist)
      return res
        .status(409)
        .json(
          await apiResponse(
            409,
            responseMessage?.dataAlreadyExist("title"),
            {},
            {}
          )
        );

    body.createdBy = user._id;
    let library = await new libraryModel(body).save();
    console.log(library);
    //create room and save id of that room in library later
    let room: any = {
      libId: ObjectId(library._id),
      userIds: [user._id],
    };
    room = await new roomModel(room).save();
    console.log(room);

    //update the libraryField of roomId
    let updatedLibrary = await libraryModel.findByIdAndUpdate(
      library._id,
      { roomId: room._id },
      { new: true }
    );

    if (!updatedLibrary) {
      return res
        .status(501)
        .json(await apiResponse(501, "invalid library data", {}, {}));
    }
    return res
      .status(200)
      .json(await apiResponse(200, "lib data", updatedLibrary, {}));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const addLibrarySections = async (
  req,
  res //{libraryId openingtime closingtime sectionDetails shifts}
) => {
  reqInfo(req);
  let body = req.body;
  let { user } = req.headers;

  try {
    //i have to save each element of array seprately into the shiftModel and return that shifts
    console.log(user._id);
    let savedSections = [];

    // body.sections.map(async(s) => //this will not work bcz of its async nature

    for (let i = 0; i < body.sections.length; i++) {
      let s = body.sections[i];
      s.createdBy = user._id;
      s.libraryId = ObjectId(body.libraryId);
      s.openingTime = new Date(body.openingTime);
      s.closingTime = new Date(body.closingTime);
      s.seats = new Array(s.totalSeats);

      //add seatNo and seatUniqueId to the seats array
      for (let j = 0; j < s.seats.length; j++) {
        let seat = {
          seatNo: j,
          seatUniqueId: getUniqueId(s.libraryId, j),
          persons: [],
        };
        s.seats[j] = seat;
      }
      const section = await new sectionModel(s).save();
      // console.log(section);
      savedSections.push(section);
    }
    // console.log(savedSections);
    if (savedSections.length == 0) {
      return res
        .status(400)
        .json(await apiResponse(400, "no shifts saved", {}, {}));
    }
    return res
      .status(200)
      .json(
        await apiResponse(
          200,
          "sections and shifts added to db",
          savedSections,
          {}
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const addBankDetails = async (
  req,
  res //bankdetails
) => {
  reqInfo(req);
  let body = req.body;
  let { user } = req.headers;
  try {
    const library = await libraryModel.findOneAndUpdate(
      { createdBy: user._id },
      { bankDetails: body },
      { new: true }
    );
    if (!library) {
      return res
        .status(404)
        .json(await apiResponse(404, "library not found!", {}, {}));
    }
    return res
      .status(200)
      .json(
        await apiResponse(
          200,
          "bankDetails added to libraryModel!",
          library,
          {}
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const getLibrarySections = async (req, res) => {
  reqInfo(req);
  let { user } = req.headers;

  try {
    const sections = await sectionModel
      .find({ createdBy: ObjectId(user._id) })
      .select("_id sectionId libraryId");
    if (sections.length == 0)
      return res
        .status(404)
        .json(await apiResponse(400, "no sections found", {}, {}));

    return res
      .status(200)
      .json(await apiResponse(200, "found sections", sections, {}));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const getLibrarySeatInfo = async (req, res) => {
  reqInfo(req);
  let { sectionId, libraryId } = req.body;
  let { user } = req.headers;

  try {
    const seatInfo = await sectionModel
      .findOne({ sectionId: sectionId, libraryId: ObjectId(libraryId) })
      .select("seats totalSeats");
    if (!seatInfo)
      return res
        .status(400)
        .json(await apiResponse(400, "unable to load seatInfo", {}, {}));

    return res
      .status(200)
      .json(await apiResponse(200, "found sections", seatInfo, {}));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const checkOfflineUserIsSignedUp = async (
  req,
  res //if signedup then send his id
) => {
  reqInfo(req);
  let { phoneNumber } = req.body;
  let { user } = req.headers;

  try {
    const student = await studentModel.findOne({ phoneNumber: phoneNumber });
    if (student)
      return res
        .status(200)
        .json(await apiResponse(200, "student found", student, {}));

    //no student means make signup of user with otp
    return res
      .status(200)
      .json(
        await apiResponse(
          200,
          "new user! please register it and then book seat for him",
          phoneNumber,
          {}
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const bookOfflineUser = async (
  req,
  res //only can book fulldayuser no shiftingUser
) => {
  reqInfo(req);
  let {
    studentId,
    sectionId,
    seatNo,
    collectedMoney,
    bookingStartDate,
    bookingEndDate,
  } = req.body;
  let { user } = req.headers;

  try {
    const student = await studentModel.findOne({ _id: ObjectId(studentId) });
    if (!student) {
      return res
        .status(400)
        .json(await apiResponse(400, "no student found!", student, {}));
    }

    const section = await sectionModel.findOne({ _id: ObjectId(sectionId) });
    if (!section)
      return res
        .status(404)
        .json(
          await apiResponse(404, "there is no section to book tikit", {}, {})
        );

    const person = {
      name: student.name,
      imageUrl:
        "https://pixabay.com/illustrations/icon-user-male-avatar-business-5359553/",
      uId: user._id,
      shift: section.sectionId,
      shiftingIntial: section.openingTime,
      shiftingEnd: section.closingTime,
      bookingStart: bookingStartDate,
      bookingEnd: bookingEndDate,
      status: "book|notScan",
    };

    const updatedSection = await sectionModel.findOneAndUpdate(
      { _id: ObjectId(sectionId), seats: { $elemMatch: { seatNo: seatNo } } },
      { $push: { "seats.$.persons": [person] } },
      { new: true }
    );

    return res
      .status(200)
      .json(
        await apiResponse(
          200,
          "booked seat info",
          updatedSection.seats[seatNo],
          {}
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const getAllStudentDetails = async (req, res) => {
  reqInfo(req);
  let body = req.body,
    { user } = req.headers;

  try {
    const library: any = await libraryModel.findOne({
      createdBy: ObjectId(user?._id), 
    }, {"students" : 1}).populate("students.userId students.latestOrder" , "name email bookingStartDate bookingEndDate duration");
    // console.log(library);

    const students = library.students;
    let storeStudents = [];
    for(let i = 0 ; i < students.length ; i ++)
    {
      let stu : any = students[i];
      let date1 = new Date(),
          date2 = new Date(stu.latestOrder.bookingEndDate);

          const diff= no_of_days_between_two_date(date1 , date2);
          stu = {...stu._doc, daysLeft : diff } ;
          storeStudents.push(stu);

    }

      return res
      .status(200)
      .json(await apiResponse(200, "students", storeStudents, {}));
    

    // const students = await libraryModel.aggregate([
    //   { $match: { createdBy: ObjectId(user._id) } },
      //{
    //     $lookup: {
    //       from: "orders",
    //       let: { stuIds: "$students" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: {
    //                 $in: ["$userId", "$$stuIds"],
    //               },
    //             },
    //           },
    //         },
    //         {
    //           $project: {
    //             userId: 1,
    //             shift: 1,
    //             duration: 1,
    //             bookingEndDate: 1,
    //             bookingStartDate: 1,
    //           },
    //         },
    //       ],
    //       as: "latestOrder",
    //     },
    //   },
    //   { $unwind: "$latestOrder" },
    //   {
    //     $sort: {
    //       "latestOrder.createdAt": -1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$_id",
    //       latestOrders: { $push: "$latestOrder" },
    //     },
    //   },
    //   {
    //     $project: {
    //       latestOrder: { $arrayElemAt: ["$latestOrders", -1] },
    //       _id: 1,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "students",
    //       let: { stuId: "$latestOrder.userId" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: {
    //                 $eq: ["$_id", "$$stuId"],
    //               },
    //             },
    //           },
    //         },
    //         {
    //           $project: {
    //             name: 1,
    //             image: 1,
    //             _id: 1,
    //             email: 1,
    //           },
    //         },
    //       ],
    //       as: "student",
    //     },
    //   },
    //   {
    //     $project: {
    //       student: 1,
    //       latestOrder: 1,
    //       daysleft: {
    //         $dateDiff: {
    //           startDate: new Date(),
    //           endDate: "$latestOrder.bookingEndDate",
    //           unit: "day",
    //         },
    //       },
    //     },
    //   },
    // ]);

      //   return res
      // .status(200)
      // .json(await apiResponse(200, "students", students, {}));
    // console.log(students);
  
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(
        await apiResponse(
          500,
          responseMessage?.internalServerError,
          null,
          error
        )
      );
  }
};

export const deActiveLibraryById = async (req, res) => { //libId
  reqInfo(req);
  let { libId, duration } = req.body,
      { user } = req.headers;

  try {
      const lib = await libraryModel.findByIdAndUpdate(ObjectId(libId), { isActive: false }, { new: true });
      if (!lib)
          return res.status(404).json(await apiResponse(404, "library not found!", {}, {}));


      const orders: any = await orderModel.find({ libId: ObjectId(libId) });

      //make change in booking end date
      for (let i = 0; i < orders.length; i++) {
          let order = orders[i];

          console.log(order.bookingEndDate);
          order.bookingEndDate = getNextDate(order.bookingEndDate, duration);
          order.save();
      }

      console.log("new orders", orders);

      return res.status(200).json(await apiResponse(200, "library deactivated successfully & updated orders of students!", orders.length, {}))

  } catch (error) {
      console.log(error);
      return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, {}, {}))
  }

}

export const addOrRemoveSeat = async (req, res) => {
  reqInfo(req);
  let { sectionId, addSeat, removeSeat } = req.body,
      { user } = req.headers;

  try {
      const section = await sectionModel.findOne({ _id: ObjectId(sectionId) });

      let seats = section.seats,
       unreservedSeats = 0;
      //make new seats array copy existing elements
      let newSeats = [];

      console.log("new array", newSeats);

      if (addSeat) {
          //copy existing elements to newArray
          for (let i = 0; i < seats.length; i++) {
              let seatData = seats[i];
              newSeats.push(seatData);
          }
          //add extra seat
          //add seatNo and seatUniqueId to the seats array
          for (let j = seats.length; j < seats.length + addSeat; j++) {
              let seat = {
                  seatNo: j,
                  seatUniqueId: getUniqueId(section.libraryId, j),
                  persons: []
              }
              newSeats.push(seat);
          }

          // console.log("new seat added to new array", newSeats);

          // console.log("new seats length", newSeats.length);
          section.seats = newSeats;
          section.save();
          // console.log("old seats length", seats.length);

          return res.status(200).json(await apiResponse(200, "seats added successfully", section.seats, {}));

      }

      if (removeSeat) {
          //check for library is full or
          //count unReserved Seats
          for (let i = 0; i < seats.length; i++) {
              let seat: any = seats[i];
              let persons = seat.persons;

              if (persons.length == 0)
                  unreservedSeats++;
          }

          if (removeSeat > unreservedSeats) {
              return res.status(404).json(await apiResponse(400, "you are trying to removing booked seat or library is booked fully", seats, {}));
          }

          //remove seat
          for (let i = 0; i < seats.length - removeSeat; i++) {
              let seatData = seats[i];
              newSeats.push(seatData);
          }

          // console.log("new seats length", newSeats.length);
          section.seats = newSeats;
          section.save();
          // console.log("updated seats length", section.seats.length);

          return res.status(200).json(await apiResponse(200, "seats removed successfully", section.seats, {}));

      }


  } catch (error) {
      console.log(error);
      return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
  }
}

export const blockUserFromChat = async (req, res) => {
  reqInfo(req);
  let { studentId } = req.body,
      { user } = req.headers;

  try {

      const blockedUser = await studentModel.findByIdAndUpdate(ObjectId(studentId), { isBaneFromChat: true }, { new: true });

      if (!blockedUser) return res.status(404).json(await apiResponse(404, "user not found!", {}, {}));

      return res.status(200).json(await apiResponse(200, "user is blocked from chatuser", blockedUser, {}));

  } catch (error) {
      console.log(error);
      return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
  }

}

export const messageInfo = async (req, res) => {
  reqInfo(req);
  let { messageId } = req.body,
      { user } = req.headers;
  try {
      //find user seatNo and name
      //name is easy with populate but seatNo from orderId we can get  --->orderId mathi leva orderTable ma seatNo update and bookSeat thay tyare allocate seat update karavani orderModel ma

      



  } catch (error) {
      console.log(error);
      return res.status(500).json(await apiResponse(500, responseMessage?.internalServerError, null, error));
  }
}
