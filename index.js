const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const multer = require('multer')


const app = express()
const port = 3000
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
const upload = multer({storage: storage})
const cors = require('cors')

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(passport.initialize())

const jwt = require('jsonwebtoken')


mongoose.connect('mongodb+srv://anhntph37315:tanh12345@mern.71gp63m.mongodb.net/ChatApp2'

).then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.log('Err: ', err))


app.listen(port, () => {
    console.log('Server running on port 3000');
})
const User = require('./models/User')
const Message = require('./models/Message')



app.post('/register', (req, res) => {
    console.log('aaaa');
    const { name, email, password, image } = req.body
    const newUser = new User({ name, email, password, image })
    newUser.save()
        .then(() => {
            res.status(200).json({ message: "User register successfully" })
        })
        .catch((err) => {
            console.log('Err registering user', err);
            res.status(500).json({ message: 'Err registing the user!' })
        })
})

//function to create a token the user
const createToken = (userId) => {
    // set the token payload
    const payload = { userId }

    // Generate the token with a seccet key and expiration time
    const token = jwt.sign(payload, 'abcdefgh', { expiresIn: '20h' })

    return token
}

// endpoint for logging in of that particular user
app.post('/login', (req, res) => {
    const { email, password } = req.body
    // check if the email and password are provider
    if (!email || !password) return res.status(404).json({ message: 'Email and the password are required' })
    User.findOne({ email }).then((user) => {

        // user not found
        if (!user) return res.status(404).json({ message: 'User not found' })

        // compare the provider passwords with the password in the database
        if (user.password !== password) return res.status(404).json({ message: 'Invalid Password!' })

        const token = createToken(user._id)
        res.status(200).json({ token })
    }).catch((err) => {
        console.log('Err registering user', err);
        res.status(500).json({ message: 'Err registing the user!' })
    })
})


// endpoint to access all the users except the user who's is currently logged in!
app.get('/user/:userId', (req, res) => {
    console.log('get user');
    const loggedInUserId = req.params.userId
    User.find({ _id: { $ne: loggedInUserId } })
        .then((users) => {
            res.status(200).json(users)
        })
        .catch((err) => {
            console.log('Err retrieving user', err);
            res.status(500).json({ message: 'Err retrieving users' })
        })
})

// endpoint to send a request to a user
app.post('/friend-request', async (req, res) => {
    const { currentUserId, selectedUserId } = req.body
    try {
        // update the recepient's friendRequestsArray
        await User.findByIdAndUpdate(selectedUserId, {
            $push: { freindRequests: currentUserId }

        })
        //update the sender's sentFriendRequests array

        await User.findByIdAndUpdate(currentUserId, {
            $push: { sentFriendRequests: selectedUserId }
        })

        res.sendStatus(200)

    } catch (error) {
        res.sendStatus(500)
    }
})


// endpoint to show all the friend-requests of a particular user
app.get('/friend-request/:userId', async (req, res) => {
    try {
        console.log('Lay DS friend');
        const { userId } = req.params

        // fetch the user document based on the User id
        const user = await User.findById(userId).populate('freindRequests', 'name email image').lean()
        const friendRequests = user.freindRequests
        res.json(friendRequests)

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' })
    }
})


// endpoint to accept a friend-request of a particular person

app.post('/friend-request/accept', async (req, res) => {
    try {
        const { senderId, recepientId } = req.body

        
        // retrieve the documents of sender and the recipient
        const sender = await User.findById(senderId)
        const recepient = await User.findById(recepientId)
        sender.friends.push(recepientId)
        recepient.friends.push(senderId)

        
        recepient.freindRequests = recepient.freindRequests.filter((req) => req.toString() !== senderId.toString())
        sender.sentFriendRequests = sender.sentFriendRequests.filter((req) => req.toString() !== recepientId.toString())


        await sender.save()
        await recepient.save()
        res.status(200).json({ message: 'Friend Request accepted successfully' })
        console.log('abc');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Err' })
    }

})


// endpoint to access all the friends of the logged in user
app.get('/accepted-fiends/:userId', async(req,res)=>{
    try {
        const {userId} = req.params
        const user = await User.findById(userId).populate(
            'friends',
            'name email image'
        )
        const acceptedFriends = user.friends
        res.json(acceptedFriends)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:'Internal Server Err'})
    }
})



// endpoint to post Message and store it in the backend
app.post('message',upload.single('imageFile'), async(req, res)=>{
    try {
        const {senderId, recepientId , messageType, messageText} = req.body
        const newMessage = new Message({
            senderId,
            recepientId,
            messageType,
            messageText,
            timeStamp: new Date(),
            imageUrl: messageType === 'image'
        })
        res.status(200).json({message:'Message sent Successfully'})
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'})
    }
})

// endpoint to get the userDetails to design the chat Room header
app.get('/user/:userId', async(req,res)=>{
    try {
        const {userId} = req.params
        // fetch the user data from the user ID
        const recepientId = await User.findById(userId)
        res.json(recepientId)
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'})
 
    }
})


// endpoint to fetch the messages between two users in the chatRoom
app.get('messages/:senderId/:recepientId', async(req,res)=>{
    try {
        const {senderId, recepientId} = req.params
        const messages = await Message.findOne({
            $or:[
                {senderId: senderId, recepientId: recepientId},
                {senderId: recepientId, recepientId:senderId}
            ]
        }).populate('senderId','_id name')
        res.json(messages)
    } catch (error) {
        console.log(error);
        res.status(500).json({error: 'Internal Server Error'})
 
    }
})