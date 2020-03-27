const validator = require('express-validator');
var async = require('async');
const { Random, MersenneTwister19937 } = require("random-js");


/** form for creating a number game */
exports.number_create_get = function(req, res) {
    res.render('numbers_form', {title: 'Start a Number Game'});
};

exports.number_create_post = [
    validator.body('amount', 'Amount of number required').trim().isLength({min: 1}),
    validator.body('amount', 'Amount must be a number').isNumeric(),
    validator.sanitizeBody('amount').escape(),

    validator.body('group_by', 'Group_by must be a number').isNumeric(),
    validator.sanitizeBody('group_by').escape(),

    (req, res, next) => {
        const err = validator.validationResult(req);

        if(! err.isEmpty()) {
            res.render('numbers_form', {
                title:'Start a Number Game',
                errors: err.array()
            })
            return;
        }else {
            res.render('number_play', {
                title: 'Play Numbers', 
                number_list: get_number_list_from_seed(req.body.amount, req.body.group_by)
            });
        }
    }
];

exports.number_verify = function(req, res) {

}

/** create random numbers to memorize from a seed */
function get_number_list_from_seed(nLine, lSize) {
    const random = new Random(MersenneTwister19937.autoSeed());
    var nList = []
    for(var i=0; i<nLine; i++){
        nList.push([]);
        for(var j=0;j<lSize;j++) {
            nList[i].push(random.integer(0,9));
        }
    }
    return nList;
}