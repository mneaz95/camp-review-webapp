let Campground = require("../models/campTable");
// let Comment = require("./models/comments");

//all the middleware goes here
let middlewareObj = {};

middlewareObj.checkCampgroundOwnerShip = function(req, res, next){
    //is user logged in?
    if(req.isAuthenticated()){
        
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err){
                //added error message
                req.flash("error", "Campground not found");
                res.redirect("/campgrounds");
            }else{
            
                //does user own the comment?
              if(foundCampground.author.id.equals(req.user._id)){
                  //we dont always want this middle ware to only edit
                        //we want it to move and delete or edit or update so we added
                            //res.render("campgrounds/edit", {campground: foundCampground});
                        next();    
              }else{
                  //added error message
                  req.flash("error", "You dont have permission to do that");
                    res.redirect("back");
              }
               
            }
        });
    }else{
        //added error message
        req.flash("error", "You need to be logged in to do that!");
        //sends the user back where they came from
        res.redirect("back");
    }
};

// middlewareObj.checkCommentOwnerShip = function(req, res, next){
//     //is user logged in?
//     if(req.isAuthenticated()){
        
//         Comment.findById(req.params.comment_id, function(err, foundComment){
//             if(err){
//                 res.redirect("/campgrounds");
//             }else{
            
//                 //does user own the comment?
//               if(foundComment.author.id.equals(req.user._id)){
//                   //we dont always want this middle ware to only edit
//                         //we want it to move and delete or edit or update so we added
//                             //res.render("campgrounds/edit", {campground: foundCampground});
//                         next();    
//               }else{
//                     req.flash("error", "You dont have permission to do that!");
//                     res.redirect("back");
//               }
               
//             }
//         });
//     }else{
//         //sends the user back where they came from
//         res.redirect("back");
//     }
// };


middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    //v11
    // success or error is the key shows if the alert is green or red
        // next argument is the message
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};

module.exports = middlewareObj;