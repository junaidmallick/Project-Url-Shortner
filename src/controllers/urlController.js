const urlModel = require("../Models/urlModel");
const shortid = require("short-id");
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  19918,
  "redis-19918.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("RFvQ3fwtJ2FG5ui7TvMCectx14LLWAii", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});



//1. connect to the server
//2. use the commands :

//Connection setup for redis------------------

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const urlShortner = async (req, res) => {
    try {
        // Validation for BaseUrl :
        let baseUrl = 'http://localhost:3000';
        if (!(/^https?:\/\/\w/).test(baseUrl)) { 
          return res.status(400).send({ status: false, msg: "Please check your Base Url, Provide a valid One." }) }

        // UrlCode Generate :
        let urlCode = shortid.generate()
        // Validation for Long Url :
        let longUrl = req.body.longUrl;
        if (!longUrl) { return res.status(400).send({ status: false, msg: "Please provide a longUrl into postman" }) }
        if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(longUrl.trim()))) { 
          return res.status(400).send({ status: false, msg: "Please provide a valid longUrl" }) }


        let duplicateLongUrl = await GET_ASYNC(`${longUrl}`)
        let duplicateLongUrlCache = JSON.parse(duplicateLongUrl)
        if (duplicateLongUrlCache) 
        return res.status(302).send({ msg: "Already a shortUrl exist with this Url in Cache", urlDetails: duplicateLongUrlCache })

        let duplicateLongUrlDB = await urlModel.findOne({ longUrl: longUrl })
         if (duplicateLongUrlDB) 
        return res.status(302).send({ msg: "Already a shortUrl exist with this Url in DB", urlDetails: duplicateLongUrlDB})


        // Generate ShortUrl :
        let shortUrl = baseUrl + '/' + urlCode;

        let data = {
            urlCode: urlCode,
            longUrl: longUrl,
            shortUrl: shortUrl
        }
        let urlDetails = await urlModel.create(data)

        let result = {
            urlCode: urlDetails.urlCode,
            longUrl: urlDetails.longUrl,
            shortUrl: urlDetails.shortUrl
        }
        await SET_ASYNC(`${longUrl}`, JSON.stringify(result))
        return res.status(201).send({ status: true, data: result })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}


const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        let urlFromCache = await GET_ASYNC(`${urlCode}`)

        if (urlFromCache) {
            return res.status(302).redirect(JSON.parse(urlFromCache))
        }
        else {
            let urlFromMongoDB = await urlModel.findOne({ urlCode: urlCode });
            if (urlFromMongoDB) {
                await SET_ASYNC(`${urlCode}`, JSON.stringify(urlFromMongoDB.longUrl))
                return res.status(302).redirect(urlFromMongoDB.longUrl);
            }
            else {
                return res.status(404).send({ status: false, msg: "No url found with this urlCode" })
            }
        }
    }
    catch (err) {
        console.log(error)
        return res.status(500).status(500).send({ status: true, message: err.message })
    }
}


module.exports = {
  urlShortner,
    getUrl
}