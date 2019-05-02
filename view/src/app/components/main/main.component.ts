import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';
import {SelectionModel} from '@angular/cdk/collections';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import {MatPaginator} from '@angular/material';






import { UploadsService } from '../../services/uploads.service';
import { Upload } from '../../models/Upload';


@Component({
  selector: 'main.component',
  styleUrls: ['main.component.css'],
  templateUrl: 'main.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0'})),
      state('expanded', style({ height: '*' })),
      transition('expanded => collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
      transition('collapsed => expanded', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})

export class MainComponent implements OnInit {
  //Paginator
  @ViewChild(MatPaginator) paginator: MatPaginator;





  //----------


  upload:Upload; //Holds selected file
  deleteCheck: number;
  filterSelect = 0;
  data = Object.assign(ELEMENT_DATA)
  uploads:Upload[];
  dataSource = new MatTableDataSource (this.uploads);

  displayedColumns: string[] = ['Filename', 'UploadDate', 'Uploader'];
  expandedElement: PeriodicElement | null;

  /** Selecting a row from the table----------------------- */
  selection = new SelectionModel<PeriodicElement>(true, []);

  select(x: PeriodicElement): void {
    this.selection.clear(); //Only allows one selected row (Deselects all rows)
    this.selection.toggle(x);// then selects current row
  }
  /** End of Selection Methods --------------------------- */

  title:string;
  description:string;
  file:File;
  
  applyFilter(filterValue: string) {
      this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  constructor(private router: Router, private uploadsService: UploadsService, public dialog: MatDialog ) { }

  @ViewChild(MatSort) sort: MatSort; 

  ngOnInit() {
    setTimeout(() => this.dataSource.paginator = this.paginator);

    this.dataSource.sort = this.sort;
     // get uploads from server
     this.uploadsService.getUploads().subscribe(uploads => {
      this.uploads = uploads.filter(x => x.delete_date === undefined);
      this.dataSource = new MatTableDataSource (this.uploads);
      this.dataSource.paginator = this.paginator;
    }); // subcribe similar to promises .then cb: asynchronous
  }

  overwriteFilter(){
    //Overwrites filterPredicate to only include certain columns
    //Changed by filterMenu
    if(this.filterSelect == 0){
      this.dataSource.filterPredicate = function(data, filter: string): boolean {
        return data.filename.toLowerCase().includes(filter); //Only filters Filename
      };
    }
    
    /*
    if(this.filterSelect == 1){
      this.dataSource.filterPredicate = function(data, filter: string): boolean {
        return data.upload_date.toLowerCase().includes(filter); //Only filters Filename
      };
    }
    */

    if(this.filterSelect == 2){
      this.dataSource.filterPredicate = function(data, filter: string): boolean {
        return data.upload_by.toLowerCase().includes(filter); //Only filters Filename
      };
    }
  }

  logout() : void{ //Logout button redirect
    this.router.navigateByUrl('/login');
  }


  fileEvent($event){
    this.file = $event.target.files[0];
  }

  submitUpload(): void{ //Upload
    var upload:FormData = new FormData();
    upload.append('title', this.title);
    upload.append('description', this.description);
    upload.append('file', this.file);
    this.uploadsService.postUpload(upload).subscribe(upload => {
      this.uploads.push(upload); // push upload to array
    })
  }

  deleteUpload(upload:Upload){
  //If user confirms Delete Confirmation box, proceed to delete
	if(this.deleteCheck == 1){ 
		// delete from UI
		this.dataSource.filterPredicate = (data: Upload, filterValue: String) => data._id !== filterValue;
		this.dataSource.filter = upload._id;
		// delete from server
    this.uploadsService.deleteUpload(upload).subscribe();
    
    //Reset deleteCheck value
		this.deleteCheck = 0;
	}
  }

  downloadFile(upload:Upload){
    this.uploadsService.postDownload(upload).subscribe(data => {
      //const blob = new Blob([data], { type: 'image/png' });
      const downloadURL = window.URL.createObjectURL(data);
      var link = document.createElement('a');
      link.href = downloadURL;
      link.download = ''+upload.filename;
      link.click();
    });
  }

  toTop() : void{ //Scrolls to the top of the page
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }

      /* When the user clicks on the button, 
    toggle between hiding and showing the dropdown content */
  myFunction() {
      document.getElementById("myDropdown").classList.toggle("show");
  }
  submitFunction() {
  //Hides form + Reloads page IF file is valid
  if(this.file.type == 'image/png'){
    document.getElementById("myDropdown").classList.toggle("show");
    location.reload();
  }
}
    
    // Close the dropdown if the user clicks outside of it
  onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }
  
  //On opening Delete Dialog Box
  openDialog(upload:Upload): void {
  //Stores file value for use in other functions
	this.upload = upload;
    const dialogRef = this.dialog.open(DeleteConfirmation,{
      width: '500px',
    });
  
  //On closing Delete Dialog Box
  dialogRef.afterClosed().subscribe(result => {
  console.log('The dialog was closed');

  //Set deleteCheck to result value
	this.deleteCheck = result;
  this.deleteUpload(this.upload);
  }); 
  }
}






//------- Old Test Values ------------------------------------
export interface PeriodicElement {
  Filename: string;
  UploadDate: string;
  Uploader: string;
  description: string;
  filesize: string;
  lastaccessed: string;
  kmlvalid: string;
}

const ELEMENT_DATA = [
{
  Filename: 'February_Report',
  UploadDate: 'March 4, 2019',
  Uploader: 'Edward T.',
  description: `Contains information collected in February`,
  filesize: `5.03 MB`,
  lastaccessed: 'March 15, 2019',
  kmlvalid: 'Success'
}, 
{
  Filename: 'March_Progress',
  UploadDate: 'March 5, 2019',
  Uploader: 'Michael S.',
  description: `Here's what we did so far`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'freeminecraftnoscam.exe',
  UploadDate: 'February 6, 2019',
  Uploader: 'notch',
  description: `no scam free minecraft`,
  filesize: `2000.55gb`,
  lastaccessed: 'October 5,1997 1:50pm',
  kmlvalid: 'Failed'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
{
  Filename: 'Real_File',
  UploadDate: 'April 1, 2019',
  Uploader: 'Jeff',
  description: `Hi`,
  filesize: `70.50gb`,
  lastaccessed: 'March 5,2019 10:50am',
  kmlvalid: 'Success'
},
];




/** For Delete Confirmation Dialog Box */
@Component({
  selector: 'delete-confirmation',
  templateUrl: 'delete-confirmation.html',

})


export class DeleteConfirmation {

  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmation>){
    }
    
  onNoClick(): void{
    // Closes dialog box on "No" option
    this.dialogRef.close();
  }
}














/**  Copyright 2017 Google Inc. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at http://angular.io/license */