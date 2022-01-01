let express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mysql = require("mysql"),
    flash = require("connect-flash"),
    passport = require("passport"),
    methodOverride = require("method-override");
    require('./passport/passport')(passport);
    require("./models/comments");
   
let dbCampTable = require("./models/campTable"),
    connection = mysql.createConnection(dbCampTable.connection);




let middleware = require("./middleware");
 

 

//to leave out the ejs, easier to write
app.set("view engine", "ejs");

//THis is for the css style sheet when you console.log dirname its gives you the directory
// /home/ubunu/workspace/YelpCamp/v(whatever version it is) then we added public
app.use(express.static(__dirname +"/public"));
app.use(express.static(__dirname +"/Pages"));
app.use(express.static(__dirname +"/js"));


//============================
app.use(bodyParser.urlencoded({extended: true}));





//--this is what they want in method _method JUST syntext
app.use(methodOverride("_method"));
//v11



//PASPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rocky is so cute",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
/*
=========================================================
*/
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



/*
adding a new middleware so we dont have to add "currentUser: req.user"
    to every ROUTE
        we want to pass that req.user to every template we have right now
            using "res.locals.currentUser = req.user;"
            THEN we need to add next() so it goes in 
*/
app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   /*
    v11 anything in the flash will have access,
        to it in the template under message
   */
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});



/*
    using the routes that we required
        this tells our app to use the three routes files
            that we required
*/
//app.use(indexRoutes);
//============================


app.get("/", function(req,res){
    res.render("landing");
    
});



app.get("/register", function(req, res){
    res.render("register", {message: req.flash('signupMessage')});
    req.flash("Welcome to YelpCamp please register");
});


app.post("/register", passport.authenticate('local-signup', {
    
    successRedirect: '/campgrounds',
    failureRedirect: '/register',
    failureFlash: true
    
}));
  


//show login form
app.get("/login", function(req,res){
    //v11
        //res.render("login", {message: req.flash("error")}); changed so flash is not only for login
    res.render("login");
});

//handingling login logic
    //this is basically app.post("/login", middleware, callback)
    
        /*
        it will call upon the local stragtegey
        */
app.post("/login", passport.authenticate("local-login", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true
        
    }), 
    function(req,res){
        req.flash("success", "Successfully logged in!");
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/campgrounds');
    
});

///////////////////////////////////////////////////////////////////////////////////////////////////
connection.query('USE ' + dbCampTable.database);
// let connection = mysql.connect();

 let allCampgrounds; 
app.get("/campgrounds", function(req,res){
       
        connection.query("SELECT * from campGround", function(err,results){
            if(err) throw err;
            allCampgrounds = results;
            res.render("campgrounds/index", {campgrounds: allCampgrounds, currentUser: req.user}); 
        });
});




//==================================

app.post("/campgrounds/new", middleware.isLoggedIn,  function(req,res){
    console.log("post");
    let name = req.body.name;
    let image = req.body.image;
    let desc = req.body.description; 
  
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    
    

   //CREATE A NEW CAMPGROUND AND SAVE TO DATABASE
   let newCamp = "insert into campGround (description, userID, image, comment, author) values(?,?,?,?,?)";
   
   console.log(typeof req.user.username );
   connection.query(newCamp, [name, req.user.id, image, desc, author.username], function(err,results){
        if(err){
            console.log(err);
        }else{
                //redirect back to campgrounds page
                console.log(results);
                res.redirect("/campgrounds");
                req.flash("success", "Successfully added review");
        }
    });


});//==================================



app.get("/campgrounds/new", middleware.isLoggedIn, function(req,res){
  res.render("campgrounds/new.ejs"); 
 
});





app.get("/campgrounds/:id", function(req, res){

    let link = req.params.id;
    let show;
 
    connection.query("select * from campGround where postID = ? ", [link] , function(err,results){
        if(err) throw err;
        else{
          show = results; 
          connection.query("select * from comments where postID = ? ",[link], function(err,comment){
            if(err) throw err;
            res.render("campgrounds/show",{campground: show[0],comment:comment, currentUser: req.user});
            
          });
        }
    });
});


//i believe this is the right code
app.post("/campgrounds/:id", function(req, res){
        var comment = req.body.confirm;  
        var currentConfirms;
     

    var newConfirms = currentConfirms+1; 
    connection.query("select * from comments where commentID = ?",[comment], function(err,results){
        if(err) throw err;
        currentConfirms = results[0].confirms+1;  
        connection.query("UPDATE comments SET confirms = ? WHERE commentID = ?", [currentConfirms, comment], function(err,result){
          if(err) throw err;
          res.redirect("/campgrounds/"+req.params.id);
        });
    });
});

//==============================================================

app.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, function(req,res){
   // let link = req.headers.referer.split("/");
   let postid = req.params.id;
   connection.query("select * from campGround where postID = ?",[postid], function(err,result){
       if(err) throw err;
        res.render("comments/new.ejs",{campground: result[0], currentUser: req.user}); 
   });
  
});


app.post("/campgrounds/:id/comments/new", function(req,res){
    let newComment = req.body.comment;
    let user = req.user.id;
    let post = req.params.id;
    let addComment = "insert into comments(description,userID,postID,author) values(?,?,?,?)";
    connection.query(addComment,[newComment,user,post,req.user.username],function(err,results){
        if(err) throw err;
        res.redirect("/campgrounds/"+post);
    });
   // res.redirect("/campgrounds/"+req.params.id);
});

//==================================================================


app.delete("/campgrounds/:id", function(req,res){
    //console.log(req.params.id);
    let postID = req.params.id;
    connection.query("delete from campGround where postID = ?", [postID],function(err,results){
             if(err){
                  console.log(req.params.id);
            res.redirect("/");
            }else{
            res.redirect("/campgrounds");
        }
    });
});

app.get("/chatroom", function(req,res){
    res.render("campgrounds/chatroom.ejs");
    
});





///////////////////////////////////////////////////////////////////////////////////////////////////
// function isLoggedIn(req, res, next){
//     if(req.isAuthenticated())
//     return next();
    
//     res.redirect('/');
// }

///////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(process.env.PORT || 5000, process.env.IP, function(){
   console.log("Nobin and Solmans Sever is running"); 
});

