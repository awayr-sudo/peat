const express = require("express");
const passport = require("passport");
const Projects = express.Router();
const { ProjectsM } = require("../models/projectsM");
const { AssignedUsers } = require("../models/assigned_usersM");
const { usersM } = require("../models/usersM");

/* 
 routes
 /projects  -> get the token user who is a manager its projects that he made
 /project/add -> add a new project
  /project/edit -> edit a project
  /project/delete -> delete a project
  /project/assign -> assign a project to a user
  /project/status -> change the status of a project
  /project/assigned -> get the assigned users of a project

 */

// this (req, res, next) purpose is like putting another block in between 1 and 2
// like a  connector which also connects a third object and the communication
// between them has to be passed through the middle ( third ) block
// if block 1 and 2 wants to communicate

Projects.get("/projects", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      try {
        if (err) {
          console.error("Error during authentication:", err);
          return res.status(500).send("Error During Authentication");
        }
        if (!user) {
          return res.status(401).json({ message: err_msg || "Unauthorized" });
        }

        if (user.role === "manager") {
          const user_projects = await user.getProjects();
          return res.json({
            message: "Welcome, " + user.full_name,
            projects: user_projects,
          });
        }

        if (user.role === "employee") {
          const assigned_projects = await AssignedUsers.findAll({
            where: { user_id: user.id },
          });
          return res.json({
            message: "Welcome, " + user.full_name,
            projects: assigned_projects,
          });
        }

        return res.status(403).send("Forbidden: Invalid role" + user.role);
      } catch (error) {
        console.error("Error fetching projects:", error);
        return res.status(500).send("Server Error");
      }
    }
  )(req, res, next);
});


Projects.post("/project/add", (req, res, next) => {
  passport.authenticate("bearer", { session: false }, async (err, user) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(500).send("Error During Authentication");
    }

    if (user.role == "manager") {
      const project = req.body.project_name;
      // since we are already getting the user from the passport library
      // we are using it here to get its id
      try {
        const added_project = await ProjectsM.create({
          p_name: project,
          user_id: user.id,
        });
        // const user_projects = await user.getProjects();    // getting the projects this user has
        // res.status(200).json({ message: user_projects });
        return res.status(201).send(added_project);
      } catch (error) {
        console.error("Error creating project:", error);
        return res.status(500).send("Error creating project");
      }
    }

    if (user.role == "employee") {
      return res.status(403).send("Employees are unauthorized");
    }

    return res.status(400).send("Role is neither manager nor employee");
  })(req, res, next);
});

Projects.post("/project/edit", (req, res, next) => {
  passport.authenticate("bearer", { session: false }, (err, user, err_msg) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(500).send("Error during authentication");
    }

    if (!user) {
      return res.status(401).send(err_msg);
    }

    if (user.role === "manager") {
      const { project_id, project_name } = req.body;

      ProjectsM.update(
        { p_name: project_name, edited_by_id: user.id },
        { where: { id: project_id } }
      )
        .then(() => {
          return res.status(200).send("Project Updated");
        })
        .catch((error) => {
          console.error("Error updating project:", error);
          return res.status(500).send("Error updating project");
        });
    } else if (user.role === "employee") {
      return res.status(403).send("Employees are unauthorized");
    } else {
      return res.status(400).send("Role is neither manager nor employee");
    }
  })(req, res, next);
});

Projects.delete("/project/delete", (req, res, next) => {
  passport.authenticate("bearer", { session: false }, (err, user, err_msg) => {
    if (err) {
      console.error("Error during authentication:", err);
      return res.status(500).send("Error during authentication");
    }

    if (!user) {
      return res.status(401).send(err_msg);
    }

    if (user.role === "manager") {
      const { project_id } = req.body;

      ProjectsM.destroy({ where: { id: project_id } })
        .then((done) => {
          if (done) {
            return res.status(200).send("Project Deleted");
          } else {
            return res.status(404).send("Project not found");
          }
        })
        .catch((error) => {
          console.error("Error deleting project:", error);
          return res.status(500).send("Error deleting project");
        });
    } else if (user.role === "employee") {
      return res.status(403).send("Employees are unauthorized");
    } else {
      return res.status(400).send("Role is neither manager nor employee");
    }
  })(req, res, next);
});

Projects.post("/project/status", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(500).send("Error during authentication");
      }

      if (!user) {
        return res.status(401).send(err_msg);
      }

      if (user.role === "manager") {
        const { status, project_id } = req.body;

        const project = await ProjectsM.findOne({
          where: { id: project_id },
        });

        try {
          project
            .update({
              status: status,
            })
            .then(() => {
              return res.status(200).send("Status Changed to " + status);
            });
        } catch (error) {
          res.status(500).send("Error Changing the status");
        }
      } else if (user.role === "employee") {
        return res.status(403).send("Employees are unauthorized");
      } else {
        return res.status(400).send("Role is neither manager nor employee");
      }
    }
  )(req, res, next);
});

Projects.post("/project/assign", (req, res, next) => {
  passport.authenticate(
    "bearer",
    { session: false },
    async (err, user, err_msg) => {
      if (err) {
        console.error("Error during authentication:", err);
        return res.status(500).send("Error during authentication");
      }

      if (!user) {
        return res.status(401).send(err_msg);
      }

      if (user.role === "manager") {
        const { project_id } = req.body;
        const { user_id } = req.body;
        console.log(user_id + " " + project_id);
        const get_project = await ProjectsM.findOne({
          where: { id: project_id },
        });
        const get_user = await usersM.findOne({ where: { id: user_id } });

        try {
          AssignedUsers.create({
            project_id: get_project.id,
            user_id: get_user.id,
          }).then(() => {
            return res.status(200).send("User Assigned");
          });
        } catch (error) {
          res.status(500).send("Assigning User to Project Error");
        }
      } else if (user.role === "employee") {
        return res.status(403).send("Employees are unauthorized");
      } else {
        return res.status(400).send("Role is neither manager nor employee");
      }
    }
  )(req, res, next);
});

module.exports = Projects;
