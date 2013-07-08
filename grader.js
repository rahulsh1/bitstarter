#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');

var HTMLFILE_DEFAULT = "test.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    //console.log("Reading " + htmlfile + " checks file " + checksfile);
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var buildfn = function(htmlfile, checkfile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            if (response) {
              console.error('Error: ' + util.format(response.message));
	    } else {
              console.error('Unable to download from given url');
            }
            process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
        } else {
            //console.error("Wrote %s", htmlfile);
            fs.writeFileSync(htmlfile, result);
            //console.log("Downloaded file: " + htmlfile + "\n");
            var checkJson = checkHtmlFile(htmlfile, checkfile);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    };
    return response2console;
};

var checkURL = function(infile) {
    if (typeof(infile) == "undefined") {
        console.log("URL argument missing. Exiting.");
        process.exit(1); 
    }
    return infile.toString();
}

var checkFile = function(infile, chkfile) {
    var appurl = checkURL(infile);
    chkfile = chkfile || CHECKSFILE_DEFAULT;
    //console.log("Downloading file from " + appurl + "\n");
    var testfile = HTMLFILE_DEFAULT;
    var response2console = buildfn(testfile, chkfile);
    rest.get(appurl).on('complete', response2console);
    return testfile;
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-u, --url <html_file>', 'URL to app', clone(checkURL))
        .parse(process.argv);
    checkFile(program.url, program.checks);

} else {
    exports.checkFile = checkFile;
}

