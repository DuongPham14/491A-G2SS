import { Component, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger, keyframes } from '@angular/animations';
import { MatSort, MatTableDataSource, MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material';

import { ApiService } from '../../services/api.service';
import { Upload } from '../../models/upload.model';
import { DatePipe } from '@angular/common';
import { UploadformComponent } from "./uploadform/uploadform.component";


@Component({
  selector: 'app-main-component',
  styleUrls: ['main.component.css'],
  templateUrl: 'main.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded => collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('collapsed => expanded', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]), // End of detailExpand trigger

  ], // End of animations
})

export class MainComponent implements OnInit {

  constructor(
    private _router: Router,
    private _apiService: ApiService,
    public dialog: MatDialog) {

  }

  deleteCheck: number;
  filterSelect = '';
  uploads: Upload[];
  uploadForm = false;

  dataSource: MatTableDataSource<Upload>;

  // For use in filtering file dates
  pipe: DatePipe;

  // Used for filtering by date
  fBar: string = '';
  fDay: string = '';
  fMonth: string = '';
  fYear: string = '';
  cDate: string = '';

  filterUse: string;
  

  displayedColumns: string[] = ['kml-icon', 'title', 'upload_date', 'upload_by', 'validation', 'size'];
  expandedElement: Upload | null;

  /** Selecting a row from the table----------------------- */
  selection = new SelectionModel<Upload>(true, []);
  /** End of Selection Methods --------------------------- */

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  select(x: Upload): void {
    this.selection.clear(); // Only allows one selected row (Deselects all rows)
    this.selection.toggle(x); // then selects current row
  }

  ngOnInit() {
    this.retrieveData();
  }

  /**
   * @description: Retrieves data using a subscription
   * to the _uploadsService.getUploads function :)
   * @param: none
   */


  pagUpdate = 0
  
  retrieveData() {
    // Get Uploads from server
       this._apiService.getUploads().subscribe(
        response => {
          this.uploads = response.filter(x => x.delete_date === undefined);
          this.dataSource = new MatTableDataSource(this.uploads);
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
          this.sort.disableClear = true;
        },
        (err) => { console.log(err); });
      // Subcribe similar to promises .then cb: asynchronous
      this.pagUpdate = 1;
  }

  // Checks when paginator changes
  onPaginateChange(event){
    this.retrieveData();
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  applyDate() {
    this.cDate = `${this.fMonth}/${this.fDay}/${this.fYear}`;
    this.dataSource.filter = this.cDate.trim();
  }

  overwriteFilter() {
    this.fMonth = '';
    this.fDay = '';
    this.fYear = '';
    this.dataSource.filter = ''; // Set filter to blank when switching
    this.dataSource.filterPredicate = (data, filter: string):boolean => {
      const formatted = this.pipe.transform(data.upload_date, 'MM/dd/yyyy');
      return formatted.indexOf(filter) >= 0;
    };
    
    if (this.filterSelect === 'date') {
      //alert(this.filterSelect);
      document.getElementById('filterBar').style.display = 'none';
      document.getElementById('filterBar1').style.display = 'flex';

      this.pipe = new DatePipe('en');
      const defaultPredicate = this.dataSource.filterPredicate;
      this.dataSource.filterPredicate = (data, filter: string):boolean => {
        const formatted = this.pipe.transform(data.upload_date, 'MM/dd/yyyy');
        return formatted.indexOf(filter) >= 0;
      };

    }

    else {
      document.getElementById('filterBar').style.display = 'block';
      document.getElementById('filterBar1').style.display = 'none';
      this.dataSource.filterPredicate = (data, filter: string): boolean => {
        return data[this.filterSelect].toLowerCase().includes(filter);
      };
    }
    
    return 0;
  }

  deleteUpload(upload: Upload) {
    // If user confirms Delete Confirmation box, proceed to delete
    if (this.deleteCheck === 1) {

      // Delete from server
      this._apiService.deleteUpload(upload).subscribe(
        (response) => {
          console.log('Response from deleting: ', response);
        },
        err => {
          console.log(err);
          if (err.status === 400) {
            console.log('Bad Request');
          }
        },
        () => {
          this.uploads.splice(this.uploads.indexOf(upload), 1);
          this.dataSource._updateChangeSubscription();
        }
      );
      // Reset deleteCheck value
      this.deleteCheck = 0;
    }
  }

  downloadFile(upload: Upload) {
    this._apiService.postDownload(upload).subscribe(data => {
      const downloadURL = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadURL;
      link.target = '_blank';
      link.download = upload.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  toTop(): void { // Scrolls to the top of the page
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }

  showUploadForm() {
    //this.uploadForm = true;
    const dialogRef = this.dialog.open(UploadformComponent, {
      width: '600px'
    });

    // On closing Delete Dialog Box
    dialogRef.afterClosed().subscribe( _ => {
      this.retrieveData ()
    });
  }


  // Close the dropdown if the user clicks outside of it
  onclick = event => {
    if (!event.target.matches('.dropbtn')) {
      const dropdowns = document.getElementsByClassName('dropdown-content');
      for (let i = 0; i < dropdowns.length; i++) {
        const openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }

}