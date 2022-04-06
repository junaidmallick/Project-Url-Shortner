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

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const urlShortner = async (req, res) => {
  try {
    let baseUrl = "http://localhost:3000";
    let urlCode = shortid.generate();
    let body = req.body;
    let longUrl = body.longUrl;

    let shortUrl = baseUrl + "/" + urlCode;
    let data = { urlCode, longUrl, shortUrl };

    // Validation for BaseUrl :
    if (!/^https?:\/\/\w/.test(baseUrl)) {
      return res
        .status(400)
        .send({
          status: false,
          msg: "Please check your Base Url, Provide a valid One.",
        });
    }

    if (Object.keys(body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "req body should have some data" });
    }

    // Validation for Long Url :
    if (!longUrl) {
      return res
        .status(400)
        .send({ status: false, msg: "Url should be present" });
    }

    if (
      !/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(
        longUrl
      )
    ) {
      return res
        .status(400)
        .send({ status: false, msg: "Please provide a valid Url" });
    }

    // Validation for Short Url :
    if (!shortUrl) {
      return res
        .status(400)
        .send({ status: false, msg: "No shortUrl found, please check again" });
    }

    let url = await urlModel.findOne({ longUrl }).select({ _id: 0, __v: 0});

    if (url) {
      return res
        .status(302)
        .send({
          status: true,
          message: "given longUrl already shorted in DB",
          useThisUrl: url
        });
    } else {
      let urlDetails = await urlModel.create(data);
      let result = {
        urlCode: urlDetails.urlCode,
        longUrl: urlDetails.longUrl,
        shortUrl: urlDetails.shortUrl,
      };
      return res.status(200).send({ status: true, url:result });
    }
  } catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
};

const getUrl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;
    let cahcedProfileData = await GET_ASYNC(`${urlCode}`);
    if (cahcedProfileData) {
      let datatype = JSON.parse(cahcedProfileData);
      return res.status(302).redirect(datatype.longUrl);
    } else {
      const profile = await urlModel.findOne({ urlCode: urlCode });
      if (profile) {
        await SET_ASYNC(`${urlCode}`, JSON.stringify(profile));
        return res.status(302).redirect(profile.longUrl);
      }else{
          return res.status(404).send({ status:false,message:"no url found with this urlCode"})
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.urlShortner = urlShortner;
module.exports.getUrl = getUrl;
