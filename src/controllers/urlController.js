const urlModel = require("../Models/urlModel")
const shortid = require('short-id')

const urlShortner = async (req, res) => {
    try {
        let baseUrl = 'http://localhost:3000';
        let urlCode = shortid.generate()
        let body = req.body;
        let longUrl = body.longUrl;
        
        let shortUrl = baseUrl + '/' + urlCode;
        let data = { urlCode, longUrl, shortUrl }

        // Validation for BaseUrl :
        if (!(/^https?:\/\/\w/).test(baseUrl)) { 
            return res.status(400).send({ status: false, msg: "Please check your Base Url, Provide a valid One." }) }

        if(Object.keys(body).length == 0) {
            return res.status(400).send({ status:false,message:"req body should have some data"}) }
        
       
        // Validation for Long Url :
        if (!longUrl) { 
            return res.status(400).send({ status: false, msg: "Url should be present" }) }

        if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(longUrl))) { 
            return res.status(400).send({ status: false, msg: "Please provide a valid Url" }) }

        // Validation for Short Url :
        if (!shortUrl) { 
            return res.status(400).send({ status: false, msg: "No shortUrl found, please check again" }) }
            
            let urlDetails = await urlModel.create(data)
            let result = {
            urlCode: urlDetails.urlCode,
            longUrl: urlDetails.longUrl,
            shortUrl: urlDetails.shortUrl
        }
        return res.status(400).send({ status: true, url: result })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, msg: error.message })
    }
}

const getUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode
        if (urlCode.length != 6) { 
            return res.status(400).send({ status: false, msg: "Please provide a valid urlCode" }) }

        let url = await urlModel.findOne({ urlCode: urlCode })

        if (!url) { 
            return res.status(404).send({ status: false, msg: "No url found with this urlCode" }) }
        if (url) { 
            return res.status(302).redirect(url.longUrl) }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports.urlShortner = urlShortner;
module.exports.getUrl = getUrl;