{/* Edit Dialog - Enhanced */}
<Dialog open={!!editingAttendeeId} onOpenChange={(open) => !open && setEditingAttendeeId(null)}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader className="border-b pb-4">
      <DialogTitle className="flex items-center gap-2 text-primary">
        {editingAttendee?.isPartner ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M1 8.25a1.25 1.25 0 112.5 0v7.5a1.25 1.25 0 11-2.5 0v-7.5zM11 3V1.7c0-.268.14-.526.395-.607A2 2 0 0114 3c0 .995-.182 1.948-.514 2.826-.204.54.166 1.174.744 1.174h2.52c1.243 0 2.261 1.01 2.146 2.247a23.864 23.864 0 01-1.341 5.974C17.153 16.323 16.072 17 14.9 17h-3.192a3 3 0 01-1.341-.317l-2.734-1.366A3 3 0 006.292 15H5V8h.963c.685 0 1.258-.483 1.612-1.068a4.011 4.011 0 012.166-1.73c.432-.143.853-.386 1.011-.814.16-.432.248-.9.248-1.388z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
          </svg>
        )}
        Edit {editingAttendee?.isPartner ? 'Partner' : 'Member'} Details
      </DialogTitle>
      {/* Additional info about the member being edited */}
    </DialogHeader>
    
    {editingAttendee && (
      <div className="mt-4">
        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
          {/* Helpful guidance text */}
        </div>
        
        {/* The actual form component based on attendee type */}
        {editingAttendee.attendeeType === 'Mason' ? (
          <MasonForm
            attendeeId={editingAttendee.attendeeId}
            attendeeNumber={1}
            isPrimary={lodgeMembers.find(m => m.attendeeId === editingAttendee.attendeeId)?.isPrimary || false}
          />
        ) : (
          <GuestForm
            attendeeId={editingAttendee.attendeeId}
            attendeeNumber={1}
            isPrimary={false}
          />
        )}
        
        {/* Close button */}
        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setEditingAttendeeId(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
            Close
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>
