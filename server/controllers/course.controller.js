"use strict";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import extend from "lodash/extend.js";
import errorHandler from "./../helpers/dbErrorHandler.js";
import formidable from "formidable";
import fs from "fs";

import jwt from "jsonwebtoken";

import config from "./../../config/config.js";
//import { max } from "lodash";
// const jwt = require("jsonwebtoken");

// Get course by ID
const courseByID = async (req, res, next, id) => {
  try {
    let course = await Course.findById(id)
      .populate("professor")
      // Don't populate students here in attendance for better performance
      // .populate("lessons.attendance.student")
      .exec();
    if (!course) {
      return res.status(400).json({
        error: "Course not found",
      });
    }
    console.log("Course: " + course);
    req.course = course;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Could not retrieve course",
    });
  }
};

const read = async (req, res) => {
  let course = req.course;

  // If needed, can populate after model being constructed.
  // Better to limit result to show only 1 lesson
  //
  // let course = await req.course.populate("lessons.attendance.student");

  // TODO - Check professor == login user, or login user is attending the course.
  // // Permission check: Check professor == current login user
  // if (req.profile.id != course.professor.id) {
  //   // User is not professor. No access
  //   return res.status(403).json({
  //     error: "User is not authorized",
  //   });
  // }
  return res.json(req.course);
};

const lessonByID = (req, res) => {
  //TODO - get lesson by ID
  next();
};

const create = async (req, res) => {
  //TODO - create course

  try {
    // let course = await Course.findById(id)
    //   .populate("professor")
    //   // Don't populate students here in attendance for better performance
    //   // .populate("lessons.attendance.student")
    //   .exec();
    // if (!course) {
    //   return res.status(400).json({
    //     error: "Course not found",
    //   });
    // }
    // console.log("Course: " + course);
    // req.course = course;
    // next();
    const currentUser = req.profile; //new User(req.profile);
    console.log(`Current user: ${currentUser}`);
    let currentProfessor = await User.findById(currentUser.id);
    console.log(`Current professor: ${currentProfessor}`);

    console.log(`name: ${req.body.name}`);
    console.log(`total_lessons: ${req.body.total_lessons}`);
    console.log(`professor: ${currentUser}`);

    let newCourse = await new Course({
      name: req.body.name, //"COMP006",
      professor: currentProfessor,
      total_lessons: req.body.total_lessons,
      lessons: [],
    }).save();

    // Create a list of students and set them as absent for all lessons

    let students = await User.list(User.Role.STUDENT);
    // console.log(`students: ${students}`);

    let attendancelist = [];
    students.forEach((student) => {
      let status = Course.Lesson.Attendance.Status.ABSENT;
      attendancelist.push(
        new Course.Lesson.Attendance({
          student: student,
          attendance_status: status,
        })
      );
    });
    // console.log(`attendancelist: ${attendancelist}`);

    for (let i = 1; i <= req.body.total_lessons; i++) {
      let lesson = new Course.Lesson({
        lesson_num: i,
        lesson_date: Date.now() + 0,
        attendance: attendancelist,
      });

      // console.log(`lesson: ${lesson}`);
      newCourse.lessons.push(lesson);
    }

    newCourse.save();
    res.json(newCourse);
    // newCourse.save().then(async (savedCourse) => {
    //   for (let lesson of savedCourse.lessons) {
    //     for (let attendance of lesson.attendance) {
    //       await attendance.populate("student").execPopulate();
    //     }
    //   }

    //   res.json(savedCourse);
    // });
  } catch (err) {
    return res.status(400).json({
      error: `Could not create course: ${err.message}`,
    });
  }
};

const listByUser = async (req, res) => {
  //TODO - list courses by user

  try {
    // Sample testing code: Current user is hardcoded as "Esther".
    // Change to current logged-in user with the professor role

    //let currentUser = await User.findByName("Esther");

    // // Get the token from the request cookies
    // console.log(`start listByUser`);
    // const token = req.cookies.t;

    // console.log(`Token: ${token}`);
    // // Verify and decode the token
    // const decoded = jwt.verify(token, config.jwtSecret);
    // console.log(`Decoded: ${decoded}`);
    // // Now, decoded._id contains the user's ID
    // const userId = decoded._id;
    // console.log(`User ID: ${userId}`);

    // // Use findById to get the user's information from the database
    // const currentUser = await User.findById(userId);

    const currentUser = req.profile;
    console.log(`Current user: ${currentUser}`);
    let courses = undefined;
    if (currentUser.user_role == "student") {
      // TODO: Workaround for student role to list all courses.
      courses = await Course.list(); //.populate("professor").exec();
    } else {
      courses = await Course.list(currentUser); //.populate("professor").exec();
    }
    // .populate("student");
    res.json(courses);
  } catch (err) {
    return res.status(400).json({
      error: `${errorHandler.getErrorMessage(err)}`,
    });
  }
};

const remove = async (req, res) => {
  //TODO - remove course
  try {
    let course = req.course;
    let deletedCourse = await course.deleteOne();
    res.json(deletedCourse);
  } catch (err) {
    return res.status(400).json({
      error: `Remove course failed - ${errorHandler.getErrorMessage(err)}`,
    });
  }
};

const courseDetails = (req, res) => {
  //TODO - get number of lessons
  const lessonNum = req.query.lessonNum ? req.query.lessonNum : 0;
  if (lessonNum > 0) {
    // Get attendance for the lesson
    // let course = req.course.populate("lessons.attendance.student");  // Cannot find after populate
    let lesson = req.course.lessons.find(
      (lesson) => lesson.lesson_num == lessonNum
    );
    if (!lesson) {
      return res.status(400).json({
        error: "Lesson not found",
      });
    }
    return res.json(lesson);
  }
  return res.json(req.course);
};

const stat = (req, res) => {
  //TODO - get statistics
};

const update = async (req, res) => {
  try {
    let course = req.course;

    const currentUser = req.profile;
    // console.log(`Current user: ${currentUser}`);
    let currentProfessor = await User.findById(currentUser.id);
    // console.log(`Current professor: ${currentProfessor}`);

    console.log(`name: ${req.body.name}`);
    console.log(`total_lessons: ${req.body.total_lessons}`);
    // console.log(`professor: ${currentUser}`);

    const total_lessons = parseInt(req.body.total_lessons);
    // console.log(total_lessons);
    console.log("isNan: " + (isNaN(total_lessons) ? "T" : "F"));

    console.log("test: " + (Number.isInteger(total_lessons) ? "T" : "F"));
    console.log("<1: " + (total_lessons < 1 ? "T" : "F"));

    if (!Number.isInteger(total_lessons) || total_lessons < 1) {
      return res.status(400).json({
        error: "Invalid total_lessons: " + req.body.total_lessons,
      });
    }
    course.name = req.body.name;
    if (
      course.total_lessons > total_lessons &&
      course.lessons.length > total_lessons
    ) {
      // No of lessons shinks. Trucate lessons and attendance records.
      // TODO: Walk through the array and remove the one with lesson number > total_lessons
      // course.total_lessons.length = total_lessons;
    }
    course.total_lessons = total_lessons;

    await course.save();
    res.json(req.course);
  } catch (err) {
    return res.status(400).json({
      error: `Update course failed - ${errorHandler.getErrorMessage(err)}`,
    });
  }
};

const updateAttendance = async (req, res) => {
  //TODO - update attendance by lesson

  let course = await Course.findById(req.course.id);
  // console.log(`course: ${course}`);
  const lessonNum = req.query.lessonNum ? req.query.lessonNum : 0;
  if (lessonNum === 0) {
    return res.status(400).json({
      error: "Lesson number is required",
    });
  }

  const maxLesson = course.total_lessons;
  // console.log(`maxLesson: ${maxLesson}, lessonNum: ${lessonNum}`);

  if (lessonNum > maxLesson) {
    return res.status(400).json({
      error: `Lesson number ${lessonNum} is greater than total lessons ${maxLesson}`,
    });
  }

  const attendData = req.body.attendance;
  if (!attendData) {
    return res.status(400).json({
      error: "Attendance data is required",
    });
  }
  let attendanceMap = new Map();

  for (const attendanceData of attendData) {
    //find student from the database using attendance data
    console.log(`attendanceData.status: ${attendanceData.attendance_status}`);
    console.log(
      `typeof attendanceData.status: ${typeof attendanceData.attendance_status}`
    );
    let student = await User.findById(attendanceData.student);
    console.log(`Student: ${student}`);
    if (!student) {
      return res.status(400).json({
        error: `Student not found for attendance: ${attendanceData.student}`,
      });
    }

    let status = attendanceData.attendance_status
      ? Course.Lesson.Attendance.Status.PRESENT
      : Course.Lesson.Attendance.Status.ABSENT;

    // Update the attendance status
    attendanceMap.set(student, status);
  }

  console.log(`finished attendanceMap: ${attendanceMap}`);
  console.log(Array.from(attendanceMap));

  req.course.updateAttendance(Number(lessonNum), attendanceMap);
  console.log(`updated atendance:`);
  console.log(`req.course: ${req.course}`);
  await req.course.save();
  res.json(req.course);
};

// Populate database with default data
const initData = async (req, res) => {
  let clear = false;
  if (req.query && req.query.clear) {
    clear = true;
  }

  try {
    if (clear) {
      await Course.deleteMany();
    }
    let students = await User.list(User.Role.STUDENT);

    let professorEsther = await User.findByName("Esther");
    let courseCOMP006 =
      !clear &&
      (await Course.findByProfessorCourseName(professorEsther, "COMP006"));
    if (!courseCOMP006) {
      // Create course COMP006
      // return res.json(professorEsther);

      let attendance = [];
      students.forEach((student) => {
        let status =
          Math.random() > 0.45
            ? Course.Lesson.Attendance.Status.PRESENT
            : Course.Lesson.Attendance.Status.ABSENT;
        attendance.push(
          new Course.Lesson.Attendance({
            student: student,
            attendance_status: status,
          })
        );
      });

      await new Course({
        name: "COMP006",
        professor: professorEsther,
        total_lessons: 6,
        lessons: [
          new Course.Lesson({
            lesson_num: 6,
            lesson_date: Date.now + 0, // Doesn't work without the calculation. Otherwise, field is not saved in MongoDB.
            attendance: attendance,
          }),
        ],
      }).save();
    }

    let professorMadison = await User.findByName("Madison");
    let courseComp102 =
      !clear &&
      (await Course.findByProfessorCourseName(professorMadison, "COMP102"));
    console.log("== New course: " + courseComp102);

    if (clear || !courseComp102.id) {
      // Create course COMP102
      courseComp102 = new Course({
        name: "COMP102",
        professor: professorMadison,
        total_lessons: 0,
        // lessons: [],
      });
      // console.log("New course: " + courseComp102);
    }

    // Add one more lesson & attendence on each execution
    courseComp102.total_lessons++;
    let attendence = new Map();
    students.forEach((student) => {
      let status =
        Math.random() > 0.45
          ? Course.Lesson.Attendance.Status.PRESENT
          : Course.Lesson.Attendance.Status.ABSENT;
      attendence.set(student, status);
    });
    courseComp102.updateAttendance(courseComp102.total_lessons, attendence);
    // console.log("Updating course: " + courseComp102);
    await courseComp102.save();

    return res.status(200).json({
      message: "Courses created in database.",
    });
  } catch (err) {
    console.error(err);
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err),
    });
  }
};

export default {
  courseByID,
  lessonByID,
  read,
  create,
  listByUser,
  update,
  remove,
  stat,
  courseDetails,
  updateAttendance,
  initData,
};
