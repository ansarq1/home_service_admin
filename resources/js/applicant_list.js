document.addEventListener('DOMContentLoaded', () => {
    const rowsPerPage = 5;
    let currentPage = 1;
    const tableBody = document.getElementById('tableBody');
    const pageNumber = document.getElementById('pageNumber');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));

    function displayPage(page) {
      const start = (page - 1) * rowsPerPage;
      const end = start + rowsPerPage;

      rows.forEach((row, index) => {
        row.style.display = (index >= start && index < end) ? '' : 'none';
      });
      pageNumber.innerText = `Page ${page}`;
    }

    function nextPage() {
      if (currentPage * rowsPerPage < rows.length) {
        currentPage++;
        displayPage(currentPage);
      }
    }

    function previousPage() {
      if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
      }
    }

    document.querySelector('#next-page').addEventListener('click', nextPage);
    document.querySelector('#previous-page').addEventListener('click', previousPage);

    displayPage(currentPage);
  });