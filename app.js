// Import Firebase SDK and initialize
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js'
import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js'

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBVu0urp-KeheIDyFeMKRSQbTphPKF0BpM',
  authDomain: 'apii-d8181.firebaseapp.com',
  databaseURL: 'https://apii-d8181-default-rtdb.firebaseio.com',
  projectId: 'apii-d8181',
  storageBucket: 'apii-d8181.appspot.com',
  messagingSenderId: '655820135951',
  appId: '1:655820135951:web:b78235c6980160d8254d7a',
  measurementId: 'G-BTYZ1MZ0YP',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Global variable to hold product data
let products = {}

// Section 1: Product Management
// Fetch and display products
async function fetchProducts() {
  const productsRef = ref(database, 'product')

  try {
    const snapshot = await get(productsRef)
    if (snapshot.exists()) {
      products = snapshot.val()
      displayProducts(products)
    } else {
      console.log('No products available')
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  }
}

function displayProducts(products) {
  const productsContainer = document.getElementById('products-container')
  productsContainer.innerHTML = ''

  for (const key in products) {
    const product = products[key]
    product.originalPrice = product.price

    const productCard = document.createElement('div')
    productCard.classList.add('product-card')
    productCard.innerHTML = `
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <p>Price: $${product.price}</p>
      <p>Strike Price: $${product.strikePrice}</p>
      <button onclick="addToCart('${key}')">Add to Cart</button>
      <div id="countdown-${key}"></div>
      
      <form id="review-form-${key}" onsubmit="submitReview(event, '${key}')">
        <label for="rating">Rating (1-5):</label>
        <input type="number" id="rating-${key}" name="rating" min="1" max="5" required>
        
        <label for="review">Review:</label>
        <textarea id="review-${key}" name="review" required></textarea>
        
        <button type="submit">Submit Review</button>
      </form>
      
      <div id="reviews-${key}"></div>
    `
    productsContainer.appendChild(productCard)

    startCountdown(key, 30)
    displayReviews(key)
  }
}

// Section 2: Cart Management
function addToCart(productId) {
  const cartRef = ref(database, `cart/${productId}`)
  get(cartRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const existingItem = snapshot.val()
        update(cartRef, { quantity: existingItem.quantity + 1 })
      } else {
        const product = products[productId]
        set(cartRef, {
          quantity: 1,
          price: product.price,
          title: product.title,
        })
      }
      fetchCart()
    })
    .catch((error) => console.error('Error adding to cart:', error))
}

async function fetchCart() {
  const cartRef = ref(database, 'cart')
  try {
    const snapshot = await get(cartRef)
    if (snapshot.exists()) {
      const cartItems = snapshot.val()
      displayCart(cartItems)
    } else {
      console.log('No items in cart')
    }
  } catch (error) {
    console.error('Error fetching cart:', error)
  }
}

function displayCart(cartItems) {
  const cartContainer = document.getElementById('cart-container')
  cartContainer.innerHTML = ''
  let totalPrice = 0

  for (const key in cartItems) {
    const item = cartItems[key]
    totalPrice += item.quantity * item.price

    const cartItem = document.createElement('div')
    cartItem.classList.add('cart-item')
    cartItem.innerHTML = `
      <h3>${item.title}</h3>
      <p>Quantity: ${item.quantity}</p>
      <p>Price: $${item.price}</p>
      <button onclick="removeFromCart('${key}')">Remove</button>
    `

    cartContainer.appendChild(cartItem)
  }

  const totalElement = document.createElement('div')
  totalElement.innerHTML = `<strong>Total Price: $${totalPrice.toFixed(
    2
  )}</strong>`
  cartContainer.appendChild(totalElement)
}

function removeFromCart(productId) {
  const cartRef = ref(database, `cart/${productId}`)
  remove(cartRef)
    .then(() => fetchCart())
    .catch((error) => console.error('Error removing item:', error))
}

// Section 3: Countdown Timer for Discounts
function startCountdown(productId, duration) {
  const countdownElement = document.getElementById(`countdown-${productId}`)
  let timeLeft = duration

  const interval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(interval)
      countdownElement.textContent = 'Price reverted'
      revertPrice(productId)
    } else {
      countdownElement.textContent = `${timeLeft} seconds remaining`
      timeLeft -= 1
    }
  }, 1000)
}

function revertPrice(productId) {
  const productRef = ref(database, `product/${productId}`)
  const product = products[productId]
  if (product && product.originalPrice !== undefined) {
    update(productRef, { price: product.originalPrice })
      .then(() =>
        console.log(`Price for product ${productId} reverted to original`)
      )
      .catch((error) => console.error('Error reverting price:', error))
  }
}

// Section 4: Review Management
function submitReview(event, productId) {
  event.preventDefault()

  const ratingInput = document.getElementById(`rating-${productId}`)
  const reviewInput = document.getElementById(`review-${productId}`)

  const rating = parseInt(ratingInput.value)
  const reviewContent = reviewInput.value

  if (rating < 1 || rating > 5) {
    alert('Please provide a rating between 1 and 5.')
    return
  }

  const reviewData = {
    userId: Date.now(),
    productId: productId,
    content: reviewContent,
    rating: rating,
  }

  const reviewsRef = push(ref(database, `review/${productId}`))
  set(reviewsRef, reviewData)
    .then(() => {
      alert('Review submitted successfully!')
      reviewInput.value = ''
      ratingInput.value = ''
      displayReviews(productId)
    })
    .catch((error) => {
      console.error('Error submitting review:', error)
      alert('Error submitting review. Please try again.')
    })
}
// Display reviews for each product
// Remaining of Review Management Section
async function displayReviews(productId) {
  const reviewsRef = ref(database, `review/${productId}`);
  const reviewsContainer = document.getElementById(`reviews-${productId}`);
  reviewsContainer.innerHTML = 'Loading reviews...';

  try {
    const snapshot = await get(reviewsRef);
    if (snapshot.exists()) {
      const reviews = snapshot.val();
      let totalRating = 0;
      let reviewCount = 0;
      let reviewsHtml = '<h3>Reviews:</h3>';

      for (const key in reviews) {
        const review = reviews[key];
        totalRating += review.rating;
        reviewCount += 1;
        reviewsHtml += `
          <p><strong>Rating:</strong> ${review.rating}</p>
          <p><strong>Review:</strong> ${review.content}</p>
          <hr>
        `;
      }

      const averageRating = (totalRating / reviewCount).toFixed(1);
      reviewsHtml =
        `<p><strong>Average Rating:</strong> ${averageRating} (${reviewCount} reviews)</p>` +
        reviewsHtml;

      reviewsContainer.innerHTML = reviewsHtml;
    } else {
      reviewsContainer.innerHTML = 'No reviews yet.';
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    reviewsContainer.innerHTML = 'Error loading reviews.';
  }
}

// Section 5: Search Management
let debounceTimeout;

// Debounced search function
function debouncedSearch() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const query = document.getElementById('search-input').value.trim();
    searchProducts(query);
  }, 300);
}

// Optimized function to search and show suggestions using Firebase query
async function searchProducts(query) {
  if (query === "") {
    fetchProducts(); // Show all products if search is cleared
    displaySuggestions([]); // Clear suggestions
    return;
  }

  try {
    const snapshot = await get(ref(database, 'product'), {
      orderByChild: "title",
      startAt: query,
      endAt: query + "\uf8ff"
    });

    if (snapshot.exists()) {
      const allProducts = snapshot.val();
      const filteredProducts = {};
      const suggestions = [];

      for (const key in allProducts) {
        const product = allProducts[key];
        filteredProducts[key] = product;
        suggestions.push({ id: key, title: product.title });
        if (suggestions.length >= 5) break; // Limit to 5 suggestions
      }

      displayProducts(filteredProducts); // Show filtered products
      displaySuggestions(suggestions); // Show suggestions
    } else {
      displaySuggestions([]); // Clear suggestions if no match
    }
  } catch (error) {
    console.error('Error searching products:', error);
  }
}

// Display suggestions in dropdown
function displaySuggestions(suggestions) {
  const suggestionsContainer = document.getElementById('suggestions-container');
  suggestionsContainer.innerHTML = '';

  suggestions.forEach((suggestion) => {
    const suggestionItem = document.createElement('div');
    suggestionItem.textContent = suggestion.title;
    suggestionItem.onclick = () => loadSelectedProduct(suggestion.id);
    suggestionsContainer.appendChild(suggestionItem);
  });
}

// Load selected product when clicked from suggestions
function loadSelectedProduct(productId) {
  const selectedProduct = {};
  selectedProduct[productId] = products[productId];
  displayProducts(selectedProduct); // Display only selected product
  document.getElementById('search-input').value = products[productId].title; // Set search bar text
  
  // Clear suggestions with a slight delay for smooth transition
  setTimeout(() => {
    displaySuggestions([]); // Clear suggestions
  }, 150);
}

// Initial data load
fetchProducts();
fetchCart();
