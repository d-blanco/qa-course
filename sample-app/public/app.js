// Shared helpers for all BookNook pages.

function money(cents) {
  return '$' + (cents / 100).toFixed(2);
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || `Error: ${res.status} ${res.statusText} ${JSON.stringify(data)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

async function refreshCartCount() {
  const cart = await api('GET', '/api/cart');
  const count = cart.items.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cart-count').textContent = count;
}

async function addToCart(bookId, qty) {
  await api('POST', '/api/cart', { bookId, qty });
  await refreshCartCount();
}

function renderHeader() {
  document.body.insertAdjacentHTML('afterbegin', `
    <header>
      <a class="logo" href="/">BookNook</a>
      <nav>
        <a href="/">Catalog</a>
        <a href="/cart.html">Cart (<span id="cart-count">0</span>)</a>
        <span id="account"></span>
      </nav>
    </header>`);
  refreshCartCount();
  renderAccount();
}

async function renderAccount() {
  const account = document.getElementById('account');
  try {
    const me = await api('GET', '/api/auth/me');
    account.innerHTML = `<span id="user-email">${me.email}</span> <a href="#" id="logout">Log out</a>`;
    document.getElementById('logout').onclick = async e => {
      e.preventDefault();
      await api('POST', '/api/auth/logout');
      location.href = '/';
    };
  } catch (e) {
    account.innerHTML = '<a href="/login.html" id="login-link">Log in</a>';
  }
}

renderHeader();
