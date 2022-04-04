const urlModel = require("../Models/urlModel")
const shortid = require('short-id')


const urlShortner = async (req, res) => {
    try {
        let baseUrl = 'http://localhost:3000';
        let urlCode = shortid.generate()
        let longUrl = (req.body.longUrl).trim();
        let shortUrl = baseUrl + '/' + urlCode;
        let data = {
            urlCode: urlCode,
            longUrl: longUrl,
            shortUrl: shortUrl
        }

        // Validation for BaseUrl :
        if (!(/^https?:\/\/\w/).test(baseUrl)) { 
            return res.status(400).send({ status: false, msg: "Please check your Base Url, Provide a valid One." }) }

        // Validation for UrlCode :
        if (!urlCode) { 
            return res.status(400).send({ status: false, msg: "urlCode should be required" }) }

        let duplicateUrlCode = await urlModel.findOne({ urlCode: urlCode })
        if (duplicateUrlCode) { 
            return res.status(400).send({ status: false, message: "urlCode already exist in the DataBase" }) }

        // Validation for Long Url :
        if (!longUrl) { 
            return res.status(400).send({ status: false, msg: "Please provide a longUrl into postman" }) }

        if (!(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%\+.~#?&//=]*)/.test(longUrl))) { return res.status(400).send({ status: false, msg: "Please provide a valid longUrl" }) }

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

module.exports.urlShortner = urlShortner
module.exports.getUrl = getUrl