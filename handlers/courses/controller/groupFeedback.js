const countries = require('countries');
const ImgurImage = require('imgur').ImgurImage;
const CourseFeedback = require('../models/courseFeedback');
const CourseParticipant = require('../models/courseParticipant');
const _ = require('lodash');

exports.all = function*() {

  var group = this.locals.group = this.groupBySlug;

  this.locals.title = "Отзыв\n" + group.title;

  this.locals.participant = this.participant;

  this.locals.countries = countries.all;

  var courseFeedback = yield CourseFeedback.findOne({
    participant: this.participant._id
  }).exec();

  if (!courseFeedback) {
    courseFeedback = new CourseFeedback({
      recommend:  true,
      isPublic:   true,
      country:    this.participant.country,
      photo:      this.participant.photo,
      aboutLink:  this.participant.aboutLink,
      city:       this.participant.city,
      occupation: this.participant.occupation
    });
  }

  if (this.method == 'POST') {
    var feedbackData = _.pick(this.request.body,
      'stars content country city isPublic recommend aboutLink occupation'.split(' ')
    );

    feedbackData.participant = this.participant._id;
    feedbackData.group = group._id;
    feedbackData.recommend = Boolean(+feedbackData.recommend);
    feedbackData.isPublic = Boolean(+feedbackData.isPublic);

    //console.log(this.request.body.photoId, feedbackData.photo, '!!!');

    _.assign(courseFeedback, feedbackData);

    if (this.request.body.photoId) {
      var photo = yield ImgurImage.findOne({imgurId: this.request.body.photoId}).exec();
      if (photo) {
        courseFeedback.photo = photo.link;
      }
    }

    try {
      yield courseFeedback.persist();
    } catch (e) {
      var errors = {};
      for (var key in e.errors) {
        errors[key] = e.errors[key].message;
      }

      this.body = this.render('groupFeedback/feedback', {
        errors: errors,
        form:   courseFeedback
      });

      return;
    }

    this.redirect(`/courses/feedback/${courseFeedback.number}`);
    return;


  } else if (this.method == 'GET') {

    this.locals.form = courseFeedback;

    this.body = this.render('groupFeedback/feedback');
  }

};

exports.post = function*() {

};
