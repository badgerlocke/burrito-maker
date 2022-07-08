const remake = document.querySelector('#remake-button')
const deleteButton = document.querySelector('#delete-button')
const messageDiv = document.querySelector('#message')
const orderNum = document.querySelector('#order-num').textContent

remake.addEventListener('click', _ => {
    fetch('/burritoes', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNum: orderNum
      })
    })
    .then(res => {
        window.location.assign('/order')
        if (res.ok) return res.json()
      })
  })

deleteButton.addEventListener('click', _ => {
    fetch('/burritoes', {
        method:'delete',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            orderNum: orderNum
        })
    })
        .then(res => {
            if (res.ok) return res.json()
        })
        .then(response => {
            if (response === 'No order to delete') {
                messageDiv.textContent = 'No order to delete'
            } else {
                messageDiv.textContent = 'Burrito was donated to the local trash panda rescue. Redirecting...'
                setTimeout(function() {window.location.assign('/')},5000)
            }
        })
})