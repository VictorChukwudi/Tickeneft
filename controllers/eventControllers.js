import axios from "axios";
import { protocol } from "../server.js";
import Event from "../models/events/eventModel.js";
import { validationResult } from "express-validator";
import { fileDelete, fileUpload } from "../config/cloudinary.js";
import { adminControl } from "../utils/access/adminAccess.js";
import { BADREQUEST, CREATED, NOTFOUND, OK, UNAUTHORIZED } from "../utils/statusCodes.js";
import Ticket from '../models/events/ticketModel.js';

const createEvent = async (req, res) => {
  try {
    const {
      title,
      organizer,
      type,
      category,
      desc,
      tags,
      venue,
      isOnline,
      url_link,
      hasLaterDate,
      isRecurring,
      start_date,
      end_date,
    } = req.body;
    const id = req.user.id;
    const images = req.files;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(BADREQUEST).json(errors.array());
    } else {
      if (images.length <= 0) {
        res.status(BADREQUEST);
        throw new Error(
          "An event image is required. Any other 3 images can be added."
        );
      } else {
        const uploader = await fileUpload(images);
        const event = await new Event({
          created_by: id,
          title,
          organizer,
          type,
          category,
          desc,
          tags,
          venue,
          isOnline,
          url_link,
          hasLaterDate,
          isRecurring,
          start_date,
          end_date,
          img_details: uploader,
        }).save();
        res.status(CREATED).json({
          status: "success",
          msg: "event created",
          data: event,
        });
      }
    }
  } catch (error) {
    res.json({
      status: "error",
      msg: error.message,
    });
  }
};

const getEvents=async(req,res)=>{
  try {
    const events= await Event.find()
  
    if(events.length<1){
      res.status(OK).json({
        status:"success",
        msg:`${events.length} events found`
      })
    }else{
      res.status(OK).json({
        status:"success",
        msg:`${events.length} events found`,
        data:events,
      })
    }
  } catch (error) {
    res.status(500).json({
      status:"error",
      msg:error.message
    })
  }
}

const getSingleEvent= async(req,res)=>{
  try{
    const id=req.params.id;
    const event= await Event.findById(id);
    const ticket= await Ticket.findOne({eventID:id}).select(["-_id"])
    if(!event || !ticket){
      res.status(NOTFOUND)
      throw new Error(`Event and ticket details with eventID: ${id} not found`);
    }else{
      res.status(OK).json({
        status:"success",
        msg:`Event with id: ${id} found`,
        data:{
          event,
          ticketDetails:ticket
        }
      })
    }
  }catch(error){
    res.json({
      status:"error",
      msg:error.message
    })
  }
}

const deleteEvent = async(req,res)=>{
  try {
    const id=req.params.id;
    const userID=req.user.id;
    // const link = `${protocol}://${req.get("host")}/${route}`
    const route=`api/tickets/${id}`
    const url= `${protocol}://${req.get("host")}/${route}`
    console.log(url)
    const event= await Event.findById(id);
    if(!event){
      res.status(NOTFOUND)
      throw new Error(`Event with id: ${id} not found`);
    }else if(event.created_by!=userID || !adminControl(userID)){
      res.status(UNAUTHORIZED)
      throw new Error("Unauthorized event delete attempt.")
    }else{
      let images=event.img_details
    images.forEach(element => {
        fileDelete(element.img_id)
      });
      
      // delete event from database
      await Event.findByIdAndDelete(id)
      //delete ticket details of event from database
      const response = await axios.delete(url);
      console.log(response.status);

      res.status(OK).json({
        status:"success",
        msg:`Event with id: ${id} deleted successfully`
      })
    }
  } catch (error) {
    console.log(error)
    res.json({
      status:"error",
      msg:error.message
    })
  }
}

// const editEvent = async(req,res)=>{
//   try {
//     const id=req.params.id
//     const userID=req.user.id

//     const {
//       title,
//       organizer,
//       type,
//       category,
//       desc,
//       tags,
//       venue,
//       isOnline,
//       url_link,
//       hasLaterDate,
//       isRecurring,
//       start_date,
//       end_date,
//     } = req.body;
    
//     const images = req.files;
//     if (images.length <= 0) {
      
//     }
    
//     const event=await Event.findById(id)
//     if(!event){
//       res.status(404)
//       throw new Error(`Event with id: ${id} not found`);
//     }else if(event.created_by!=userID || !adminControl(userID)){
//       res.status(401)
//       throw new Error("Unauthorized event edit attempt.")
//     }else{

//     }
//   } catch (error) {
    
//   }
// }

const filterEventBySearchParam=async(req,res)=>{
  try {
    const search=req.query.search
    if(!search){
      res.status(BADREQUEST)
      throw new Error("Search is empty.")
    }else{
      const events=await Event.find({$text:{ $search:search}})
      res.status(OK).json({
        status:"success",
        msg:`${events.length} found.`,
        data:events
      })
    }
  } catch (error) {
    res.json({
      status:"error",
      msg:error.message
    })
  }
}

export { createEvent, getEvents, getSingleEvent, deleteEvent
,filterEventBySearchParam};
