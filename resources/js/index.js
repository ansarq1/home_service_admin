// document.addEventListener('DOMContentLoaded', () => {
//     let passwordInput = document.getElementById('password-input');
//     let test = document.querySelector('h1');

//     function passwordValidate() {
//         const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

//         if (passwordPattern.test(passwordInput.value)) {
//             test.style.color = 'green';
//         } else {
//             test.style.color = 'red';
//         }
//     }

//     // Trigger validation on input events (like typing)
//     passwordInput.addEventListener('input', passwordValidate);
// });

let suffixIconShow = document.getElementById('suffix-icon-show');
let sufficIconHide = document.getElementById('suffix-icon-hide');
let passwordInput = document.getElementById('password-input');

function showPassword() {
    passwordInput.type = 'text';
    suffixIconShow.style.display = 'none';
    sufficIconHide.style.display = 'block';
}

function dontShowPassword() {
    passwordInput.type = 'password';
    suffixIconShow.style.display = 'block';
    sufficIconHide.style.display = 'none';
}


suffixIconShow.addEventListener('click', showPassword)
sufficIconHide.addEventListener('click', dontShowPassword)

document.addEventListener('DOMContentLoaded', () => {
  const applicants = [
    { name: 'John Doe', service: 'Web Development' },
    { name: 'Jane Smith', service: 'Graphic Design' },
    { name: 'Robert Brown', service: 'App Development' },
    { name: 'Emily Johnson', service: 'Digital Marketing' }
  ];
  
  const tableBody = document.querySelector('#applicantsTable tbody');
  
  function populateTable() {
    applicants.forEach(applicant => {
      const row = document.createElement('tr');
  
      const nameCell = document.createElement('td');
      nameCell.textContent = applicant.name;
      row.appendChild(nameCell);
  
      const serviceCell = document.createElement('td');
      serviceCell.textContent = applicant.service;
      row.appendChild(serviceCell);
  
      tableBody.appendChild(row);
    });
  }
  
  populateTable();
});
