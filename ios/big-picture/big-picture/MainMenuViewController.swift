//
//  MainMenuViewController.swift
//  big-picture
//
//  Created by Ethan Hardy on 2016-01-23.
//  Copyright © 2016 ethanhardy. All rights reserved.
//

import UIKit

class MainMenuViewController: UIViewController, UITableViewDelegate, UITableViewDataSource {
    
    var socketDelegate : SocketDelegate!
    var worksInProgress : [Picture]?
    var completedImages : [Picture]?
    @IBOutlet var picturesTableView : UITableView!
    
    override func viewDidLoad() {
        socketDelegate = SocketDelegate(url: SocketDelegate.urlBase, menuVC: self)
    }
    
    @IBAction func beginPictureDrawing() {
        socketDelegate.askForImage { (picture) -> Void in
            self.performSegueWithIdentifier("showPictureVCSegue", sender: picture)
        }
    }
    
    func goToViewWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForImageWithId(imageID) { (picture) -> Void in
            self.performSegueWithIdentifier("showPictureProgressSegue", sender: picture)
        }
    }
    
    func goToContributeToWorkInProgressWithImageID(imageID: String) {
        socketDelegate.askForImageWithId(imageID) { (picture) -> Void in
            self.performSegueWithIdentifier("showPictureVCSegue", sender: picture)
        }
    }
    
    func receivePictures(wip: [Picture], comp: [Picture]) {
        worksInProgress = wip
        completedImages = comp
        picturesTableView.reloadData()
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell : WorkInProgressTableViewCell = tableView.dequeueReusableCellWithIdentifier("workInProgress")! as! WorkInProgressTableViewCell
        if let workInProgress = worksInProgress?[indexPath.row] {
            cell.setupCell(workInProgress.colors, gestureTargetP: self, imageIDP: workInProgress.imageID, title: workInProgress.friendlyName!)
        }
        return cell
    }
    
    func tableView(tableView: UITableView, heightForRowAtIndexPath indexPath: NSIndexPath) -> CGFloat {
        return 60
    }

    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        if (worksInProgress != nil) {
            return worksInProgress!.count
        }
        else {
            return 0
        }
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if let picture = sender as? Picture, vc = segue.destinationViewController as? PictureDrawViewController {
            vc.setPicture(picture, sDelegate: self.socketDelegate)
        }
    }
}
