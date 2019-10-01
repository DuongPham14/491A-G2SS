import { Component, OnInit, ViewChild } from '@angular/core';
import { animate, state, style, transition, trigger, keyframes } from '@angular/animations';
import { MatSort, MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { SelectionModel } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material';

import { UploadsService } from '../../services/uploads.service';
import { Upload } from '../../models/Upload';
import { DatePipe } from '@angular/common';

// import 'http://js.api.here.com/v3/3.0/mapsjs-data.js ';
//

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
    private _uploadsService: UploadsService) { 
    
    }
    
  deleteCheck: number;
  filterSelect = "";
  uploads: Upload[];
  uploadForm: boolean = false;
  
  dataSource: MatTableDataSource<Upload>;

  // For use in filtering file dates
  pipe: DatePipe;

  displayedColumns: string[] = ['title', 'upload_date', 'upload_by'];
  expandedElement: Upload | null;

  /** Selecting a row from the table----------------------- */
  selection = new SelectionModel<Upload>(true, []);
  /** End of Selection Methods --------------------------- */

  @ViewChild(MatSort) sort: MatSort;

  select(x: Upload): void {
    this.selection.clear(); // Only allows one selected row (Deselects all rows)
    this.selection.toggle(x); // then selects current row
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngOnInit() {
    this.retrieveData();
  }


  /**
   * @description: Retrieves data using a subscription
   * to the _uploadsService.getUploads function :)
   * @param: none
   */

  retrieveData() {
    // get uploads from server
    this._uploadsService.getUploads().subscribe(
      response => {
        this.uploads = response.filter(x => x.delete_date === undefined);
       
        this.dataSource = new MatTableDataSource(this.uploads);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.sort.disableClear = true;
      },
      (err) => { console.log(err)},
      () => { }); 
    // subcribe similar to promises .then cb: asynchronous
    
  }

  overwriteFilter() {
    this.dataSource.filterPredicate = (data, filter: string): boolean => {
      return data[this.filterSelect].toLowerCase().includes(filter);
    };
  }


  toTop(): void { // Scrolls to the top of the page
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }

  showUploadForm() {
    this.uploadForm = true;
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
