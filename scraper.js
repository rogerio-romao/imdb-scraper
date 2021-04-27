const fetch = require('node-fetch')
const cheerio = require('cheerio')

const searchUrl = 'https://www.imdb.com/find?s=tt&ttype=ft&ref_=fn_ft&q='
const movieUrl = 'https://www.imdb.com/title/'

const searchCache = {}
const movieCache = {}

function searchMovies(searchTerm) {
  if (searchCache[searchTerm]) return Promise.resolve(searchCache[searchTerm])
  return fetch(`${searchUrl}${searchTerm}`)
    .then((response) => response.text())
    .then((body) => {
      const movies = []
      const $ = cheerio.load(body)
      $('.findResult').each(function (i, element) {
        const $element = $(element)
        const $image = $element.find('td a img')
        const $title = $element.find('td.result_text a')
        const imdbID = $title.attr('href').match(/\/title\/(.*)\//)[1]
        const movie = {
          image: $image.attr('src'),
          title: $title.text(),
          imdbID
        }
        movies.push(movie)
      })
      searchCache[searchTerm] = movies
      return movies
    })
}

function getMovie(imdbID) {
  if (movieCache[imdbID]) return Promise.resolve(movieCache[imdbID])
  return fetch(`${movieUrl}${imdbID}`)
    .then((response) => response.text())
    .then((body) => {
      const $ = cheerio.load(body)
      const $title = $('.title_wrapper h1')
      const title = $title
        .first()
        .contents()
        .filter(function () {
          return this.type === 'text'
        })
        .text()
        .trim()
      const rating = $('.subtext')
        .first()
        .contents()
        .filter(function () {
          return this.type === 'text'
        })
        .text()
        .trim()
        .replace(/\s|,/g, '')
      const runTime = $('time')
        .first()
        .contents()
        .filter(function () {
          return this.type === 'text'
        })
        .text()
        .trim()

      let genres = []
      $('.subtext a').each(function (i, element) {
        const genre = $(element).text()
        genres.push(genre)
      })

      const datePublished = genres.pop().replace('\n', '')

      const imdbRating = $('span[itemProp="ratingValue"]').text()

      const poster = $('div.poster a img').attr('src')

      const summary = $('#titleStoryLine .inline p span').text().trim()

      const director = $('.credit_summary_item a').first().text()

      const stars = $('.plot_summary .credit_summary_item')
        .last()
        .text()
        .split('|')[0]
        .replace('Stars:\n', '')
        .trim()

      const $trailer = $('.videoPreview__videoContainer a').attr('href')
      const trailer = `https://www.imdb.com${$trailer}`

      const movie = {
        imdbID,
        title,
        rating,
        runTime,
        genres,
        datePublished,
        imdbRating,
        poster,
        summary,
        director,
        stars,
        trailer
      }
      movieCache[imdbID] = movie
      return movie
    })
}

module.exports = {
  searchMovies,
  getMovie
}
