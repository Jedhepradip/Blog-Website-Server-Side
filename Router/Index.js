import express from "express"
import bcrypt, { hash } from "bcrypt"
import { jwtAuthMiddleware, generateToken } from "../JwtToken/jwt.js"
import UserModel from "../Model/UserModel.js";
import PostBlog from "../Model/PostBlog.js";
import Contact from "../Model/Contact.js";
import multer from "multer";
import nodemailer from "nodemailer"
import chalk from "chalk";
const router = express.Router()

// User Registration 
router.post('/signin/data', async (req, res) => {
    try {
        let { name, email, password, Cpassword } = req.body;

        const userExists = await UserModel.findOne({ Email: email });

        if (userExists) {
            return res.status(409).json({ message: 'Email Already Exists' });
        }

        let HasPassword = await bcrypt.hash(password, 11)

        if (password === Cpassword) {
            const UserDate = new UserModel({
                Name: name,
                Email: email,
                Password: HasPassword,
            })
            const DateSave = await UserDate.save()

            const payload = {
                id: DateSave.id,
                email: DateSave.Email
            }
            const token = generateToken(payload)
            return res.status(200).json({ message: 'Registration Successful', token: token, Id: DateSave.id })
        }
        else {
            return res.status(400).json({ message: "Password Is Not Mach" })
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// User Login
router.post("/Login/Home", async (req, res) => {
    try {
        const { email, password } = await req.body;
        // console.log(req.body);
        const User = await UserModel.findOne({ Email: email })

        if (!User) {
            return res.status(404).json({ message: "User not found" })
        }

        const passwordMatch = await bcrypt.compare(password, User.Password)

        if (!passwordMatch) {
            return res.status(404).json({ message: "Invalid credentials" })
        }

        const payload = {
            id: User.id,
            email: User.Email
        }

        const token = generateToken(payload)

        console.log("token Login", token);
        return res.status(200).json({ message: 'Registration Successful', token: token })

    } catch (error) {
        console.log(error);
        return res.status(501).json({ message: "Internal server error" })
    }
})

// User contact
router.post("/User/Contact", async (req, res) => {
    try {
        console.log("req body :", req.body);
        const { name, number, subject, message } = req.body
        if (!name || !number || !subject || !message) return res.status(400).json({ message: "all Fild Is The require" })
        const ContactDate = new Contact({
            Name: name,
            Number: number,
            Subject: subject,
            Message: message
        })
        await ContactDate.save()
        return res.status(200).json({ message: "Contact Date Save Successful" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// User Profile Edit
router.put('/User/Profile/Edit', jwtAuthMiddleware, async (req, res) => {
    try {
        const loggedInUserId = req.user.id;  // User ID from JWT middlewar

        console.log("okokok");


        if (!loggedInUserId) return res.status(403).json({ message: 'Unauthorized to update this profile' });

        let updatedUserData = req.body;
        const UserEmail = updatedUserData.Email
        const UserName = updatedUserData.Name
        const UserPassword = updatedUserData.Password

        const user = await UserModel.findById(loggedInUserId);

        console.log("user :", user);


        if (!UserName) updatedUserData.Name = user.Name

        if (!UserEmail) updatedUserData.Email = user.Email

        if (UserPassword) {
            let Salt = await bcrypt.genSalt(11);
            let HasPassword = await bcrypt.hash(UserPassword, Salt);
            updatedUserData.Password = HasPassword
            updatedUserData.Salt = Salt
        }
        else {
            updatedUserData.Password = user.Password
        }

        const UserEmailExists = await UserModel.findOne({ Email: UserEmail });
        if (UserEmailExists) {
            const user = await UserModel.findById(loggedInUserId)
            // console.log("user.Email :",user.Email);
            if (!user.Email === UserEmail) return res.status(409).json({ message: 'Email Already Exists' });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(loggedInUserId, updatedUserData, {
            new: true
        })

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ message: "Profile updated successfully", updatedUser: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// User Profile Data Send to The Fronted
router.get("/user/profile", jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        if (userId) {
            const UserFind = await UserModel.findById(userId)

            if (!UserFind) {
                return res.status(400).json({ Message: "User Not Found " })
            }

            let allPosts = [];
            const PostBlogDate = UserFind.posts

            for (let index = 0; index < PostBlogDate.length; index++) {
                let findtheidtoPost = await PostBlog.findById(PostBlogDate[index])
                if (findtheidtoPost) {
                    allPosts.push(findtheidtoPost);
                }
            }
            return res.status(201).json({ user: UserFind, Blogarr: allPosts })
        }

    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        res.status(500).json({ msg: "Internal server error" });
    }
});

// Post Blog Img Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cd) {
        cd(null, 'uploads/')
    },
    filename: function (req, file, cd) {
        cd(null, file.originalname);
    }
})
const upload = multer({ storage: storage });

// Blog Save to the Database
router.post("/BlogPost", jwtAuthMiddleware, upload.single('Img'), async (req, res) => {
    try {
        let userId = req.user.id;
        const { title, Desc, Date } = req.body;
        const user = await UserModel.findById(userId);
        console.log("user ", user);

        console.log(req.body);

        console.log("req.file.originalname :", req.file.originalname);
        if (!user) return res.status(404).json({ message: "User not found" });
        const newPost = new PostBlog({
            Image: req.file.originalname,
            Title: title,
            Desc: Desc,
            Date: Date,
            author: user._id
        });

        await newPost.save();
        user.posts.push(newPost._id);
        await user.save();
        const populatedUser = await UserModel.findOne({ _id: user._id }).populate('posts').exec();
        console.log("newPost", newPost);

        return res.status(200).json({ message: "Post Blog Successfully uploaded", user: populatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Post Blog Delete
router.delete("/BlogPostDelete/:Id", async (req, res) => {
    try {
        let PostBlogId = req.params.Id

        const findthePostBlog = await PostBlog.findById(PostBlogId)

        if (!findthePostBlog) return res.status({ message: "Post Blog Is Not Found " })

        const BlogPostDelete = await PostBlog.findByIdAndDelete(findthePostBlog)

        return res.status(201).json({ message: "Post Blog Delete successfully" })

    } catch (error) {
        console.log(error);
        return res.status(501).json({ message: "Internal server error" })
    }
});

// Blog Post Data Send To the Fronted
router.get("/Blog/Date", async (req, res) => {
    try {
        const PostBlogDate = await PostBlog.find()
        // console.log(PostBlogDate);
        return res.status(200).json(PostBlogDate);
    } catch (error) {
        console.log(error);
        return res.status(501).json({ message: "Internal Server Error" })
    }
})

// User Post Blog Edit 
router.put("/blog/edit/:bid", jwtAuthMiddleware, upload.single('Img'), async (req, res) => {
    try {
        const blogId = req.params.bid;
        let { title, Desc, Date } = req.body;

        const blog = await PostBlog.findById(blogId);

        if (!blog) return res.status(404).json({ msg: "Blog not found" });

        if (!title) { title = blog.Title }
        if (!Desc) { Desc = blog.Desc }
        if (!Date) { Date = blog.Date }
        if (req.file) { blog.Image = req.file.originalname }

        blog.Title = title;
        blog.Desc = Desc;
        blog.Date = Date;

        await blog.save();
        res.status(200).json({ msg: "Blog updated successfully", blog });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// Show the defualt value to the UI
router.get("/findBlog/:uid", jwtAuthMiddleware, async (req, res) => {
    try {
        const BlogId = req.params.uid

        console.log("findBlog :", BlogId);

        const blog = await PostBlog.findById(BlogId)

        if (!blog) return res.status(404).json({ msg: "Blog not found" });

        console.log("blog", blog);

        return res.status(200).json(blog)

    } catch (error) {
        console.log(error);
        return res.status(501).json({ message: "Internal Server Error" })
    }
})

//route for storing comment in blog working code 
router.post("/comment/blog/:id", jwtAuthMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { comment } = req.body;
        const blogId = req.params.id;
        const blog = await PostBlog.findById(blogId);
        if (!blog) return res.status(404).json({ msg: "Blog post not found" });
        blog.comment.push({ comments: comment, createdBy: userId });
        await blog.save();
        res.status(200).json({ blog });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ msg: "Internal server error" });
    }
});

router.get("/blog/comments/:Id", jwtAuthMiddleware, async (req, res) => {
    try {
        const BlogId = req.params.Id;
        const user = req.user.id

        const BLog = await PostBlog.findById(BlogId);
        if (!BLog) return res.status(404).json({ message: "Blog Not Found" });
        const comments = await PostBlog.findById(BlogId)
        let UserName = [];
        let UserId = [];

        for (let index = 0; index < comments.comment.length; index++) {
            let UserIdBlog = comments.comment[index].createdBy.toHexString()
            let user = await UserModel.findById(UserIdBlog)
            UserName.push(user.Name)
        }
        UserId.push(user)
        console.log("User Name :", { UserName: UserName, UserId: UserId });
        res.status(200).json({ comments, UserName, UserId: UserId });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server Error" });
    }
});

router.get("/blog/like/:id", jwtAuthMiddleware, async (req, res) => {
    try {
        const blogId = req.params.id;
        const userId = req.user.id;
        const blog = await PostBlog.findById(blogId);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }
        const hasLiked = blog.likes.some(like => like.like.toHexString() === userId);

        if (hasLiked) {
            blog.likes = blog.likes.filter(like => like.like.toHexString() !== userId);
        } else {
            blog.likes.push({ like: userId });

        }
        await blog.save();
        const updatedLikes = blog.likes.map(like => like.like.toHexString());
        res.status(200).json({ likes: updatedLikes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.put("/:blogId/BlogId/:bid", jwtAuthMiddleware, async (req, res) => {
    try {
        const BlogId = req.params.bid
        const commentId = req.params.blogId
        const Blog = await PostBlog.findById(BlogId)

        const blogtrufal = Blog.comment.some(comm => comm._id.toHexString() === commentId)
        console.log("blogtrufal :", blogtrufal);

        if (blogtrufal) {
            Blog.comment = Blog.comment.filter(comm => comm._id.toHexString() !== commentId)
        }
        await Blog.save()
        console.log(Blog);
        res.status(200).json({ message: "Comment Deleted" })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

let randomNo;
router.post("/Forgrtpassword/Email", async (req, res) => {
    try {
        const UserEmail = req.body.email
        const user = await UserModel.findOne({ Email: UserEmail })
        console.log("user :", user);

        randomNo = Math.floor(Math.random() * 9000) + 1000;
        console.log("randomNo :", randomNo);
        if (!user) return res.status(400).json({ message: "User Not Found!" })
        const Email = user.Email

        const transporter = nodemailer.createTransport({
            host: process.env.NODEMAILER_HOST_NAME,
            service: process.env.NODEMAILER_SERVICE,
            secure: true,
            port: process.env.NODEMAILER_PORT,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            },
            logger: true, // log to console
            debug: true,
        });
        async function main() {
            const info = await transporter.sendMail({
                from: process.env.FROM,
                to: `${Email}`,
                subject: "Pradip Jedhe ✔",
                text: "Hello world?",
                html: ` <b>Your One time Password (OTP) For Login : ${randomNo}</b><br><br>
                <spen style="color: red;"> OTP is valid only for 05:00 mins. do not share this OTP with anyone.<br><br>
                Please note that the OTP is valid for only one session. If you try to refresh the page or leave the NextStep portal, you will be required to regenerate a new OTP.
                <br><br>
                If you did not request this OTP, please connect with us immediately at </spen> <br><br><br>
                Pradip Jedhe 
                <p>Talent Acquisition Group </p>
                <p>Tata Consultancy Services </p>
               <p style=color: blue;">pradipjedhe69@gmail.com</p>
                `
            });
            console.log(chalk.green.bold("Email sent successfully!"));
        }
        main().catch(console.error);

        console.log("User Id", user._id);
        res.status(200).json({
            message: "OTP Send Successfully",
            UserId: user._id
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error " })
    }
})

router.post("/Forgrtpassword/OTP", async (req, res) => {
    try {
        const EmailOTP = req.body.otp;
        console.log("EmailOTP:", EmailOTP);
        console.log("randomNo:", randomNo);

        const OTP = randomNo == EmailOTP
        if (!OTP) return res.status(404).json({ message: "The OTP is incorrect. Please try again." });

        res.status(200).json({ message: "OTP verified successfully." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.post("/CreatePassword/:Uid", async (req, res) => {
    try {
        const UserId = req.params.Uid;
        const Newpassword = req.body.password;
        const email = req.body.email;
        const User = await UserModel.findById(UserId);
        const checkEmail = await UserModel.findOne({ Email: email }).select('Email');

        if (!checkEmail) {
            return res.status(404).json({ message: "User not found" });
        }
        if (User) {
            const Salt = await bcrypt.genSalt(11);
            const HashedPassword = await bcrypt.hash(Newpassword, Salt);
            console.log("Hashed Password:", HashedPassword);

            const updatedUser = await UserModel.findByIdAndUpdate(UserId, { Password: HashedPassword }, { new: true }).select('Password');

            return res.status(200).json({ message: "Password updated successfully", user: updatedUser });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("Error updating password:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router